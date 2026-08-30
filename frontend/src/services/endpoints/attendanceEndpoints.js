import { get, post, put, del } from '../apiClient';

// Backend: routes/attendance_routes.py (prefix /attendance)

/**
 * payload: { student_id, date?, status: 'present'|'absent'|'leave', marked_by? }
 */
export const markAttendance = (payload) => post('/attendance/', payload, { auth: 'admin' });

export const listAttendance = (query = {}) => get('/attendance/', { auth: 'admin', query });

export const getStudentAttendance = (studentId) =>
  get(`/attendance/student/${studentId}`, { auth: 'admin' });

/**
 * payload can include any of: { date, status, marked_by }
 */
export const updateAttendance = (attendanceId, payload) =>
  put(`/attendance/${attendanceId}`, payload, { auth: 'admin' });

export const deleteAttendance = (attendanceId) =>
  del(`/attendance/${attendanceId}`, { auth: 'admin' });
