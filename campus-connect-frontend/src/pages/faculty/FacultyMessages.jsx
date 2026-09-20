/**
 * FacultyMessages — Faculty messaging interface for communicating with enrolled students.
 */
import { useState, useEffect, useRef } from 'react';
import {
  getConversations,
  getEligibleRecipients,
  getMessages,
  startConversation,
  sendMessage,
} from '../../api/messageApi';
import {
  HiOutlineChatAlt2,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePaperAirplane,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineX,
} from 'react-icons/hi';
import '../../styles/dashboard.css';
import '../../styles/components.css';
import '../../styles/messaging.css';

export default function FacultyMessages() {
  const [conversations, setConversations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [inputContent, setInputContent] = useState('');

  // Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRecipientKey, setSelectedRecipientKey] = useState('');
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Initial Data Loading
  const loadData = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const [convRes, recipRes] = await Promise.all([
        getConversations(),
        getEligibleRecipients().catch(() => ({ data: { data: [] } })),
      ]);
      const convList = convRes.data.data || [];
      setConversations(convList);
      setRecipients(recipRes.data.data || []);

      if (convList.length > 0 && !activeConv) {
        selectConversation(convList[0]);
      }
    } catch (err) {
      console.error('Failed to load faculty conversations', err);
      setError('Could not load conversations. Please verify your connection.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Select & Load Message Thread
  const selectConversation = async (conv) => {
    setActiveConv(conv);
    try {
      setLoadingMessages(true);
      const res = await getMessages(conv.id);
      setMessages(res.data.data || []);

      // Decrement unread count locally for this conversation in list
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages for conversation', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Scroll to bottom of message stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send Message / Reply
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputContent.trim();
    if (!trimmed || !activeConv || sending) return;

    try {
      setSending(true);
      const res = await sendMessage(activeConv.id, trimmed);
      const sentMsg = res.data.data;
      setMessages((prev) => [...prev, sentMsg]);
      setInputContent('');

      const snippet = trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessageSnippet: snippet, lastMessageAt: sentMsg.sentAt }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 4. Start New Conversation with Enrolled Student
  const handleStartConversation = async (e) => {
    e.preventDefault();
    if (!selectedRecipientKey) {
      setModalError('Please select an enrolled student.');
      return;
    }
    if (!newInitialMessage.trim()) {
      setModalError('Please enter an initial message.');
      return;
    }

    try {
      setModalSubmitting(true);
      setModalError(null);

      const [sId, cId] = selectedRecipientKey.split('_');
      const res = await startConversation({
        recipientId: Number(sId),
        courseId: Number(cId),
        message: newInitialMessage.trim(),
      });

      const newOrUpdatedConv = res.data.data;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === newOrUpdatedConv.id);
        if (exists) {
          return prev.map((c) => (c.id === newOrUpdatedConv.id ? newOrUpdatedConv : c));
        }
        return [newOrUpdatedConv, ...prev];
      });

      setShowNewModal(false);
      setSelectedRecipientKey('');
      setNewInitialMessage('');

      selectConversation(newOrUpdatedConv);
    } catch (err) {
      console.error('Failed to start conversation', err);
      setModalError(err.response?.data?.message || 'Failed to start conversation.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.studentName?.toLowerCase().includes(term) ||
      c.studentRollNumber?.toLowerCase().includes(term) ||
      c.courseCode?.toLowerCase().includes(term) ||
      c.lastMessageSnippet?.toLowerCase().includes(term)
    );
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Page Title */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>💬 Student Communications</h1>
          <p>Direct communication channel with students enrolled in your assigned courses.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowNewModal(true);
            setModalError(null);
          }}
        >
          <HiOutlinePlus /> Message Student
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <HiOutlineExclamationCircle /> {error}
        </div>
      )}

      {/* Messaging Layout */}
      <div className={`messaging-layout ${activeConv ? 'chat-active' : ''}`}>
        {/* Left: Conversation List */}
        <div className="conversation-list-panel">
          <div className="conversation-panel-header">
            <h2>
              <HiOutlineChatAlt2 style={{ color: 'var(--color-primary)' }} />
              Conversations
            </h2>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              {conversations.length}
            </span>
          </div>

          <div className="conversation-search-box">
            <div style={{ position: 'relative' }}>
              <HiOutlineSearch
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                className="conversation-search-input"
                placeholder="Search students or courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="conversation-items-scroll">
            {loadingList ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No conversations found</p>
                <p style={{ fontSize: 'var(--font-size-xs)' }}>
                  Click "Message Student" to start a communication thread with an enrolled student.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeConv?.id === c.id;
                const initials = c.studentName
                  ? c.studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'S';

                return (
                  <button
                    key={c.id}
                    className={`conversation-card ${isActive ? 'active' : ''}`}
                    onClick={() => selectConversation(c)}
                  >
                    <div className="conversation-card-avatar" style={{ background: 'linear-gradient(135deg, #0284c7, #06b6d4)' }}>
                      {initials}
                    </div>
                    <div className="conversation-card-content">
                      <div className="conversation-card-top">
                        <span className="conversation-card-name">{c.studentName}</span>
                        <span className="conversation-card-time">{formatTime(c.lastMessageAt)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span className="conversation-card-course">{c.courseCode}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>({c.studentRollNumber})</span>
                      </div>
                      <p className="conversation-card-snippet">
                        {c.lastMessageSnippet || 'No messages yet'}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="conversation-card-badge">{c.unreadCount}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Chat Thread Window */}
        <div className="chat-window">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-user">
                  <button
                    className="btn btn-outline btn-sm mobile-back-btn"
                    style={{ marginRight: '0.5rem', display: 'none' }}
                    onClick={() => setActiveConv(null)}
                  >
                    <HiOutlineArrowLeft />
                  </button>
                  <div
                    className="conversation-card-avatar"
                    style={{
                      width: 40,
                      height: 40,
                      fontSize: '0.85rem',
                      background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                    }}
                  >
                    {activeConv.studentName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="chat-header-title">{activeConv.studentName}</h3>
                    <div className="chat-header-subtitle">
                      Roll No: <strong>{activeConv.studentRollNumber}</strong> &bull;{' '}
                      <strong>{activeConv.courseCode}</strong> - {activeConv.courseName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="chat-messages-body">
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    Loading message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-placeholder">
                    <HiOutlineChatAlt2 className="chat-empty-icon" />
                    <p style={{ fontWeight: 600 }}>No messages yet</p>
                    <p style={{ fontSize: 'var(--font-size-xs)' }}>
                      Start your conversation with {activeConv.studentName}.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isFaculty = m.senderRole === 'FACULTY';
                    return (
                      <div
                        key={m.id}
                        className={`message-row ${isFaculty ? 'sent' : 'received'}`}
                      >
                        <span className="message-sender-name">
                          {isFaculty ? 'You' : m.senderName}
                        </span>
                        <div className="message-bubble">{m.content}</div>
                        <div className="message-meta">
                          <span>{formatTime(m.sentAt)}</span>
                          {isFaculty && (
                            <span
                              className={m.isRead ? 'message-status-read' : ''}
                              title={m.isRead ? `Read by student at ${formatTime(m.readAt)}` : 'Delivered'}
                            >
                              <HiOutlineCheck />
                              {m.isRead && <HiOutlineCheck style={{ marginLeft: -6 }} />}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Composer Footer */}
              <div className="chat-composer">
                <form onSubmit={handleSendMessage} className="chat-composer-form">
                  <textarea
                    className="chat-composer-input"
                    placeholder="Type your response to student... (Press Enter to send, Shift+Enter for newline)"
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={2000}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary chat-composer-btn"
                    disabled={!inputContent.trim() || sending}
                  >
                    <HiOutlinePaperAirplane style={{ transform: 'rotate(90deg)' }} />
                    {sending ? 'Sending...' : 'Reply'}
                  </button>
                </form>
                <div className="chat-char-counter">
                  {inputContent.length} / 2000 characters
                </div>
              </div>
            </>
          ) : (
            <div className="chat-empty-placeholder">
              <HiOutlineChatAlt2 className="chat-empty-icon" />
              <h3>No Conversation Selected</h3>
              <p style={{ maxWidth: 360, marginTop: '0.5rem', fontSize: 'var(--font-size-sm)' }}>
                Select a message thread from the left or click "Message Student" to initiate an inquiry or announcement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Conversation */}
      {showNewModal && (
        <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Message Enrolled Student</h3>
              <button className="modal-close-btn" onClick={() => setShowNewModal(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleStartConversation}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    <HiOutlineExclamationCircle /> {modalError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Select Enrolled Student *</label>
                  {recipients.length === 0 ? (
                    <div className="alert alert-warning" style={{ fontSize: 'var(--font-size-xs)' }}>
                      No students found enrolled in your assigned courses.
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={selectedRecipientKey}
                      onChange={(e) => setSelectedRecipientKey(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Student & Course --</option>
                      {recipients.map((r, idx) => (
                        <option key={`${r.id}_${r.courseId}_${idx}`} value={`${r.id}_${r.courseId}`}>
                          {r.name} (Roll: {r.identifier}) — [{r.courseCode}] {r.courseName}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                    Note: You can only communicate with students enrolled in your assigned courses.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Type your message to the student..."
                    value={newInitialMessage}
                    onChange={(e) => setNewInitialMessage(e.target.value)}
                    maxLength={2000}
                    required
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {newInitialMessage.length} / 2000 characters
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewModal(false)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalSubmitting || !selectedRecipientKey || !newInitialMessage.trim()}
                >
                  {modalSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
