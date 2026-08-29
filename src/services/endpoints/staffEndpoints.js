import { get, post, put, del } from '../apiClient';

// Backend: routes/admin_routes.py, /auth/staff/* — Super Admin only.

/**
 * Full staff directory. Pass status = 'pending' | 'active' | 'inactive' to filter.
 */
export const listStaff = (status) => get('/auth/staff', { auth: 'admin', query: { status_filter: status } });

/**
 * Shortcut for the "Pending Approvals" screen.
 */
export const listPendingStaff = () => get('/auth/staff/pending', { auth: 'admin' });

export const approveStaff = (staffId) => put(`/auth/staff/${staffId}/approve`, null, { auth: 'admin' });

export const rejectStaff = (staffId) => put(`/auth/staff/${staffId}/reject`, null, { auth: 'admin' });

/**
 * Blocks login for a staff member who has left, without deleting their history.
 */
export const deactivateStaff = (staffId) => put(`/auth/staff/${staffId}/deactivate`, null, { auth: 'admin' });

export const reactivateStaff = (staffId) => put(`/auth/staff/${staffId}/reactivate`, null, { auth: 'admin' });

/**
 * Permanently removes a staff account (cannot delete your own logged-in account).
 */
export const deleteStaff = (staffId) => del(`/auth/staff/${staffId}`, { auth: 'admin' });

/**
 * Per-staff work-tracking dashboard: tasks_completed, tasks_last_30_days,
 * last_active_at, currently_working_on.
 */
export const getStaffActivity = (staffId) => get(`/auth/staff/${staffId}/activity`, { auth: 'admin' });

export const listTeachers = () => get('/auth/teachers', { auth: 'admin' });

export const onboardTeacher = (payload) => post('/auth/teachers/onboard', payload, { auth: 'admin' });

export const updateTeacherStatus = (teacherId, status) =>
  put(`/auth/teachers/${teacherId}/status`, { status }, { auth: 'admin' });
