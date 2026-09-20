/**
 * Schedule API client functions — REST calls for timetable management and lookups.
 */
import api from './axiosConfig';

/** Get all schedules (supports query params: day, courseId, facultyId, room, semester, department) */
export const getAllSchedules = (params = {}) => {
  return api.get('/schedules', { params });
};

/** Get a single schedule by ID */
export const getScheduleById = (id) => {
  return api.get(`/schedules/${id}`);
};

/** Create a new class schedule (Admin only) */
export const createSchedule = (data) => {
  return api.post('/schedules', data);
};

/** Update an existing class schedule (Admin only) */
export const updateSchedule = (id, data) => {
  return api.put(`/schedules/${id}`, data);
};

/** Delete a class schedule (Admin only) */
export const deleteSchedule = (id) => {
  return api.delete(`/schedules/${id}`);
};

/** Get schedules for a specific day */
export const getSchedulesByDay = (day) => {
  return api.get(`/schedules/day/${day}`);
};

/** Get schedules for a specific course */
export const getSchedulesByCourse = (courseId) => {
  return api.get(`/schedules/course/${courseId}`);
};

/** Get teaching timetable for logged-in faculty */
export const getMyFacultySchedules = () => {
  return api.get('/schedules/faculty/my');
};

/** Get enrolled courses timetable for logged-in student */
export const getMyStudentSchedules = () => {
  return api.get('/schedules/student/my');
};

/** Get today's class schedule for the authenticated user */
export const getTodaySchedules = () => {
  return api.get('/schedules/today');
};

/** Get upcoming/remaining classes for today for the authenticated user */
export const getUpcomingClasses = () => {
  return api.get('/schedules/upcoming');
};
