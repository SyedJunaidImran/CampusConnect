/**
 * Assignment API client functions — REST calls for assignment management.
 */
import api from './axiosConfig';

/** Get all assignments (role-aware: student/faculty/admin) */
export const getAllAssignments = () => {
  return api.get('/assignments');
};

/** Get a single assignment by ID */
export const getAssignment = (id) => {
  return api.get(`/assignments/${id}`);
};

/** Get assignments for a specific course */
export const getAssignmentsByCourse = (courseId) => {
  return api.get(`/assignments/course/${courseId}`);
};

/** Get assignments created by logged-in faculty */
export const getMyAssignments = () => {
  return api.get('/assignments/my');
};

/** Create a new assignment (Faculty / Admin) */
export const createAssignment = (data) => {
  return api.post('/assignments', data);
};

/** Update an assignment (Faculty / Admin) */
export const updateAssignment = (id, data) => {
  return api.put(`/assignments/${id}`, data);
};

/** Delete an assignment (Faculty / Admin) */
export const deleteAssignment = (id) => {
  return api.delete(`/assignments/${id}`);
};

/** Get all submissions for an assignment (Faculty / Admin) */
export const getAssignmentSubmissions = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/submissions`);
};

/** Get submission statistics for an assignment (Faculty / Admin) */
export const getAssignmentStatistics = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/statistics`);
};
