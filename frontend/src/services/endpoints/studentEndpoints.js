import { get, post, put, del } from '../apiClient';

// Backend: routes/student_routes.py (prefix /students)

export const createStudent = (payload) => post('/students/', payload, { auth: 'admin' });

export const listStudents = (query = {}) => get('/students/', { auth: 'admin', query });

export const getStudent = (studentId) => get(`/students/${studentId}`, { auth: 'admin' });

export const updateStudent = (studentId, payload) =>
  put(`/students/${studentId}`, payload, { auth: 'admin' });

export const deleteStudent = (studentId) => del(`/students/${studentId}`, { auth: 'admin' });

/**
 * Generates/rotates a student's portal login credentials (login_id + password).
 */
export const createStudentCredentials = (studentId) =>
  post(`/students/${studentId}/credentials`, null, { auth: 'admin' });
