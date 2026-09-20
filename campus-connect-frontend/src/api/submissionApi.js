/**
 * Submission API client functions — REST calls for assignment submissions and grading.
 */
import api from './axiosConfig';

/** Submit an assignment (Student) */
export const submitAssignment = (assignmentId, data) => {
  return api.post(`/submissions/assignment/${assignmentId}`, data);
};

/** Update a submission (Student, before grading) */
export const updateSubmission = (id, data) => {
  return api.put(`/submissions/${id}`, data);
};

/** Get all submissions for the logged-in student */
export const getMySubmissions = () => {
  return api.get('/submissions/my');
};

/** Get student's submission for a specific assignment */
export const getMySubmissionForAssignment = (assignmentId) => {
  return api.get(`/submissions/my/assignment/${assignmentId}`);
};

/** Get a specific submission by ID */
export const getSubmission = (id) => {
  return api.get(`/submissions/${id}`);
};

/** Grade a submission (Faculty / Admin) */
export const gradeSubmission = (id, data) => {
  return api.put(`/submissions/${id}/grade`, data);
};
