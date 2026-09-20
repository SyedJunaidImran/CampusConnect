/**
 * Auth API functions — all authentication-related HTTP calls.
 *
 * Each function is a thin wrapper around an Axios call.
 * Components import these functions instead of using Axios directly.
 *
 * WHY? If the endpoint URL changes, you fix it in ONE place.
 * Components just call: const result = await registerStudent(data);
 */
import api from './axiosConfig';

/** Register a new student account */
export const registerStudent = (data) => {
  return api.post('/auth/register/student', data);
};

/** Login (works for students, faculty, and admins) */
export const loginUser = (data) => {
  return api.post('/auth/login', data);
};

/** Get the currently authenticated user's profile */
export const getCurrentUser = () => {
  return api.get('/auth/me');
};
