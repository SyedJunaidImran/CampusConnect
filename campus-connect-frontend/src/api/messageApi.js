/**
 * Message & Conversation API client functions — REST endpoints for secure student-faculty messaging.
 */
import api from './axiosConfig';

/** Get all conversations for current user (student or faculty) */
export const getConversations = () => {
  return api.get('/conversations');
};

/** Get authorized recipients for starting a new conversation */
export const getEligibleRecipients = () => {
  return api.get('/conversations/recipients');
};

/** Get unread message count for current user badge indicators */
export const getUnreadMessageCount = () => {
  return api.get('/conversations/unread-count');
};

/** Get a single conversation overview by ID */
export const getConversation = (id) => {
  return api.get(`/conversations/${id}`);
};

/** Get messages history for a conversation (auto-marks incoming unread messages as read) */
export const getMessages = (conversationId) => {
  return api.get(`/conversations/${conversationId}/messages`);
};

/** Start a new conversation with an initial message */
export const startConversation = (data) => {
  return api.post('/conversations', data);
};

/** Send a message in an existing conversation */
export const sendMessage = (conversationId, content) => {
  return api.post(`/conversations/${conversationId}/messages`, { content });
};

/** Explicitly mark conversation messages as read */
export const markConversationAsRead = (conversationId) => {
  return api.post(`/conversations/${conversationId}/read`);
};
