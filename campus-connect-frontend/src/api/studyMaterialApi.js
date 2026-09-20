/**
 * Study Material API client functions — REST and file streaming calls for course materials.
 */
import api from './axiosConfig';

/** Get all study materials (role-aware: student enrolled, faculty assigned, or admin all) */
export const getAllStudyMaterials = () => {
  return api.get('/study-materials');
};

/** Get a single study material by ID */
export const getStudyMaterial = (id) => {
  return api.get(`/study-materials/${id}`);
};

/** Get study materials for a specific course */
export const getStudyMaterialsByCourse = (courseId) => {
  return api.get(`/study-materials/course/${courseId}`);
};

/** Create a new study material with file upload (Faculty / Admin) */
export const createStudyMaterial = (formData) => {
  return api.post('/study-materials', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/** Update an existing study material with optional file replacement (Faculty / Admin) */
export const updateStudyMaterial = (id, formData) => {
  return api.put(`/study-materials/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/** Delete a study material and its stored file (Faculty / Admin) */
export const deleteStudyMaterial = (id) => {
  return api.delete(`/study-materials/${id}`);
};

/** Download study material file with JWT auth and trigger browser download */
export const downloadStudyMaterialFile = async (id, fileName) => {
  const response = await api.get(`/study-materials/${id}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || `study-material-${id}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/** Open/preview study material in a new browser tab with JWT auth */
export const viewStudyMaterialFile = async (id, fileName) => {
  const response = await api.get(`/study-materials/${id}/view`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/pdf',
  });
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};
