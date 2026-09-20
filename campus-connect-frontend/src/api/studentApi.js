/**
 * Student API functions — profile management, enrollments, and student roster.
 */
import api from './axiosConfig';

/** Get logged-in student's profile */
export const getStudentProfile = () => {
  return api.get('/students/profile');
};

/** Update logged-in student's profile */
export const updateStudentProfile = (data) => {
  return api.put('/students/profile', data);
};

/** Get courses the logged-in student is enrolled in */
export const getMyEnrolledCourses = () => {
  return api.get('/students/courses');
};

/** Enroll logged-in student in a course */
export const enrollInCourse = (courseId) => {
  return api.post(`/students/enroll/${courseId}`);
};

/** Unenroll logged-in student from a course */
export const unenrollFromCourse = (courseId) => {
  return api.delete(`/students/unenroll/${courseId}`);
};

/** Get all students directory (Admin only) */
export const getAllStudents = () => {
  return api.get('/students');
};

/** Get student by ID (Admin only) */
export const getStudentById = (id) => {
  return api.get(`/students/${id}`);
};
