/**
 * Faculty API functions — directory lookups.
 */
import api from './axiosConfig';

/** Get all faculty members */
export const getAllFaculty = () => {
  return api.get('/faculty');
};
