/**
 * Course API functions — REST calls for course management and roster.
 */
import api from './axiosConfig';

/** Get all courses (includes isEnrolled flag if student) */
export const getAllCourses = () => {
  return api.get('/courses');
};

/** Get course details by ID */
export const getCourseById = (id) => {
  return api.get(`/courses/${id}`);
};

/** Create a new course (Admin only) */
export const createCourse = (data) => {
  return api.post('/courses', data);
};

/** Update course (Admin only) */
export const updateCourse = (id, data) => {
  return api.put(`/courses/${id}`, data);
};

/** Delete course (Admin only) */
export const deleteCourse = (id) => {
  return api.delete(`/courses/${id}`);
};

/** Get courses assigned to logged-in faculty */
export const getMyFacultyCourses = () => {
  return api.get('/courses/faculty/my-courses');
};

/** Get student roster for a course (Faculty / Admin) */
export const getCourseStudents = (courseId) => {
  return api.get(`/courses/${courseId}/students`);
};
