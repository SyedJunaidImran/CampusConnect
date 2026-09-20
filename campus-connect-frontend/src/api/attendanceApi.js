/**
 * Attendance API client functions — REST communication for attendance management.
 */
import api from './axiosConfig';

/** Submit batch attendance for a course on a date (Faculty / Admin) */
export const submitBatchAttendance = (data) => {
  return api.post('/attendance/batch', data);
};

/** Update a single attendance record */
export const updateAttendanceRecord = (id, data) => {
  return api.put(`/attendance/${id}`, data);
};

/** Get attendance sheet for a course on a date */
export const getCourseAttendanceOnDate = (courseId, date) => {
  return api.get(`/attendance/course/${courseId}/date/${date}`);
};

/** Get distinct dates for which attendance was taken for a course */
export const getCourseAttendanceDates = (courseId) => {
  return api.get(`/attendance/course/${courseId}/dates`);
};

/** Get current student's overall & course-wise attendance summary */
export const getMyAttendance = () => {
  return api.get('/attendance/my');
};

/** Get current student's attendance history for a course */
export const getMyCourseAttendanceHistory = (courseId) => {
  return api.get(`/attendance/my/course/${courseId}`);
};

/** Get attendance summary for a student by ID (Faculty / Admin) */
export const getStudentAttendanceById = (studentId) => {
  return api.get(`/attendance/student/${studentId}`);
};
