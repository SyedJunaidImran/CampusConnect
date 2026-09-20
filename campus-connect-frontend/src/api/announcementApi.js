/**
 * Announcement API client functions — REST endpoints for notices, broadcasts, and read tracking.
 */
import api from './axiosConfig';

/** Get all announcements (role-aware: student, faculty, admin) with optional query params */
export const getAllAnnouncements = (params = {}) => {
  return api.get('/announcements', { params });
};

/** Get unread announcements count for current user */
export const getUnreadCount = () => {
  return api.get('/announcements/unread-count');
};

/** Get a single announcement by ID (auto marks as read) */
export const getAnnouncement = (id) => {
  return api.get(`/announcements/${id}`);
};

/** Create a new announcement (Faculty / Admin) */
export const createAnnouncement = (data) => {
  return api.post('/announcements', data);
};

/** Update an existing announcement (Faculty / Admin) */
export const updateAnnouncement = (id, data) => {
  return api.put(`/announcements/${id}`, data);
};

/** Delete an announcement (Faculty / Admin) */
export const deleteAnnouncement = (id) => {
  return api.delete(`/announcements/${id}`);
};

/** Toggle announcement publish status */
export const togglePublishAnnouncement = (id, publish) => {
  return api.patch(`/announcements/${id}/publish`, null, {
    params: { publish },
  });
};

/** Mark a single announcement as read */
export const markAnnouncementAsRead = (id) => {
  return api.post(`/announcements/${id}/read`);
};

/** Mark all accessible announcements as read */
export const markAllAnnouncementsAsRead = () => {
  return api.post('/announcements/read-all');
};
