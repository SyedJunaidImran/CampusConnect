/**
 * analyticsApi — API client for CampusConnect Phase 10 Analytics & Reports.
 */
import api from './axiosConfig';

/**
 * Get comprehensive system-wide analytics (Admin only)
 */
export const getAdminAnalytics = () => {
  return api.get('/analytics/admin');
};

/**
 * Get overview analytics for all courses taught by the authenticated faculty
 */
export const getFacultyAnalytics = () => {
  return api.get('/analytics/faculty');
};

/**
 * Get detailed analytics for a specific assigned course (Faculty/Admin)
 * @param {number|string} courseId
 */
export const getFacultyCourseAnalytics = (courseId) => {
  return api.get(`/analytics/faculty/course/${courseId}`);
};

/**
 * Get academic overview analytics for the authenticated student
 */
export const getStudentAnalytics = () => {
  return api.get('/analytics/student');
};

/**
 * Get detailed attendance analytics for the authenticated student
 */
export const getStudentAttendanceAnalytics = () => {
  return api.get('/analytics/student/attendance');
};

/**
 * Get detailed assignment and grade analytics for the authenticated student
 */
export const getStudentAssignmentAnalytics = () => {
  return api.get('/analytics/student/assignments');
};
