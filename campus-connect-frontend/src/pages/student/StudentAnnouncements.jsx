/**
 * StudentAnnouncements — Notice board and notification center for students.
 */
import { useState, useEffect } from 'react';
import {
  getAllAnnouncements,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
} from '../../api/announcementApi';
import {
  HiOutlineSpeakerphone,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineBookOpen,
  HiOutlineExclamationCircle,
  HiOutlineGlobeAlt,
  HiOutlineEye,
  HiOutlineX,
} from 'react-icons/hi';
import '../../styles/dashboard.css';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllAnnouncements();
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Failed to load announcements', err);
      setError('Could not load announcements. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markAnnouncementAsRead(id);
      setAnnouncements(prev =>
        prev.map(a => (a.id === id ? { ...a, isRead: true, readAt: new Date().toISOString() } : a))
      );
    } catch (err) {
      console.error('Failed to mark announcement as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllAnnouncementsAsRead();
      setAnnouncements(prev =>
        prev.map(a => ({ ...a, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = (announcement) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.isRead) {
      handleMarkAsRead(announcement.id);
    }
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;

  const filteredAnnouncements = announcements.filter(a => {
    // Search query filter
    const matchesSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      a.courseCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.courseName?.toLowerCase().includes(search.toLowerCase());

    // Audience filter
    let matchesAudience = true;
    if (audienceFilter === 'GLOBAL') {
      matchesAudience = a.targetAudience === 'GLOBAL' || a.targetAudience === 'STUDENT';
    } else if (audienceFilter === 'COURSE') {
      matchesAudience = a.targetAudience === 'COURSE';
    }

    // Unread filter
    let matchesUnread = true;
    if (unreadOnly) {
      matchesUnread = !a.isRead;
    }

    return matchesSearch && matchesAudience && matchesUnread;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-danger">🚨 Urgent</span>;
      case 'IMPORTANT':
        return <span className="badge badge-warning">⚠️ Important</span>;
      default:
        return <span className="badge badge-primary">📌 General</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>📢 Announcements & Notifications</h2>
          <p>Stay up to date with official college notices, academic schedules, and course announcements.</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-outline"
            style={{ borderColor: 'var(--color-primary)', background: '#fff' }}
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
          >
            <HiOutlineCheckCircle /> {actionLoading ? 'Updating...' : `Mark All as Read (${unreadCount})`}
          </button>
        )}
      </div>

      {/* Controls & Filter Bar */}
      <div className="dashboard-section" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div className="search-bar" style={{ minWidth: '280px', flex: 1 }}>
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search announcements, authors, or courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${audienceFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAudienceFilter('ALL')}
            >
              All Notices
            </button>
            <button
              className={`btn btn-sm ${audienceFilter === 'GLOBAL' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAudienceFilter('GLOBAL')}
            >
              <HiOutlineGlobeAlt /> Campus-Wide
            </button>
            <button
              className={`btn btn-sm ${audienceFilter === 'COURSE' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAudienceFilter('COURSE')}
            >
              <HiOutlineBookOpen /> Course Notices
            </button>
            <button
              className={`btn btn-sm ${unreadOnly ? 'btn-warning' : 'btn-outline'}`}
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              {unreadOnly ? '🔔 Unread Only' : '🔔 Show Unread'}
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List / Feed */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading announcement feed...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HiOutlineExclamationCircle /> {error}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h4>No announcements found</h4>
          <p>
            {unreadOnly
              ? "You've read all your notifications! Great job staying caught up."
              : 'There are no active notices matching your selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAnnouncements.map((announcement) => {
            const isUnread = !announcement.isRead;
            return (
              <div
                key={announcement.id}
                className="card"
                onClick={() => handleOpenDetail(announcement)}
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: isUnread ? '4px solid var(--color-primary)' : '4px solid transparent',
                  background: isUnread ? 'rgba(79, 70, 229, 0.02)' : 'var(--color-surface)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {getPriorityBadge(announcement.priority)}

                      {announcement.targetAudience === 'COURSE' ? (
                        <span className="badge badge-success">
                          <HiOutlineBookOpen style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                          {announcement.courseCode} — {announcement.courseName}
                        </span>
                      ) : (
                        <span className="badge badge-outline">
                          <HiOutlineGlobeAlt style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                          {announcement.targetAudience === 'GLOBAL' ? 'Campus-Wide Broadcast' : 'Student Notice'}
                        </span>
                      )}

                      {isUnread && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
                          New
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem', fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
                      {announcement.title}
                    </h3>

                    <p style={{
                      margin: '0 0 0.75rem',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {announcement.content}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiOutlineUser /> {announcement.authorName} ({announcement.authorRole})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiOutlineClock /> {formatDate(announcement.publishedAt || announcement.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isUnread && (
                      <button
                        className="btn btn-outline btn-sm"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(announcement.id, e)}
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      >
                        <HiOutlineCheckCircle /> Mark Read
                      </button>
                    )}
                    <button className="btn btn-primary btn-sm" style={{ fontSize: 'var(--font-size-xs)' }}>
                      <HiOutlineEye /> View Notice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {getPriorityBadge(selectedAnnouncement.priority)}
                <span className="badge badge-outline">
                  {selectedAnnouncement.targetAudience === 'COURSE'
                    ? `${selectedAnnouncement.courseCode} - ${selectedAnnouncement.courseName}`
                    : selectedAnnouncement.targetAudience}
                </span>
              </div>
              <button className="modal-close" onClick={() => setSelectedAnnouncement(null)}>
                <HiOutlineX />
              </button>
            </div>

            <h3 style={{ marginTop: '0.5rem', marginBottom: '0.75rem', fontSize: '1.3rem' }}>
              {selectedAnnouncement.title}
            </h3>

            <div style={{ display: 'flex', gap: '1rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <span>
                <strong>Posted by:</strong> {selectedAnnouncement.authorName} ({selectedAnnouncement.authorRole})
              </span>
              <span>
                <strong>Date:</strong> {formatDate(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt)}
              </span>
            </div>

            <div style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: 1.7,
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-wrap',
              maxHeight: '350px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {selectedAnnouncement.content}
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => setSelectedAnnouncement(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
