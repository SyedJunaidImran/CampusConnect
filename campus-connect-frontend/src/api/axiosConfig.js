/**
 * Axios Configuration — centralized HTTP client setup.
 *
 * WHY A SEPARATE AXIOS INSTANCE?
 * Instead of using axios directly everywhere, we create a configured instance.
 * This lets us:
 * 1. Set the base URL once (all API calls use relative paths)
 * 2. Automatically attach the JWT token to every request
 * 3. Handle common errors (401, 500) in one place
 *
 * HOW THE INTERCEPTOR WORKS:
 * Before every request, the interceptor checks localStorage for a JWT token.
 * If found, it adds "Authorization: Bearer <token>" to the request header.
 * This means individual API calls don't need to worry about auth headers.
 */
import axios from 'axios';

// Create a custom Axios instance with the backend base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Runs BEFORE every HTTP request is sent.
 * Attaches the JWT token from localStorage to the Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * Runs AFTER every HTTP response is received.
 * If we get a 401 (Unauthorized), the token has expired or is invalid.
 * We clear localStorage and redirect to login.
 */
api.interceptors.response.use(
  (response) => response, // Successful responses pass through unchanged
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid — force logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
