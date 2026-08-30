import { get, post } from '../apiClient';
import { tokenStorage } from '../tokenStorage';

// Backend: routes/student_portal_routes.py
// auth_router  -> prefix /student-auth
// portal_router -> prefix /student-portal (requires student token)

/**
 * payload: { login_id, password }  (login_id is issued by an admin via
 * studentEndpoints.createStudentCredentials)
 */
export async function loginStudent({ loginId, password }) {
  const response = await post('/student-auth/login', { login_id: loginId, password });
  if (response.ok && response.data?.access_token) {
    // Login response only returns { access_token, token_type, student_id, login_id }.
    // Full profile (name, course, etc.) comes from GET /student-portal/me afterwards.
    await tokenStorage.setStudentSession(response.data.access_token, {
      student_id: response.data.student_id,
      login_id: response.data.login_id,
    });
  }
  return response;
}

export async function logoutStudent() {
  await tokenStorage.clearStudentSession();
}

export const getMyProfile = () => get('/student-portal/me', { auth: 'student' });

export const getMyFees = () => get('/student-portal/me/fees', { auth: 'student' });

export const getMyAttendance = () => get('/student-portal/me/attendance', { auth: 'student' });

export const getMyAssignments = () => get('/student-portal/me/assignments', { auth: 'student' });

export const submitMyAssignment = (assignmentId, payload) =>
  post(`/student-portal/assignments/${assignmentId}/submit`, payload, { auth: 'student' });

export const getMyCurriculum = () => get('/student-portal/me/curriculum', { auth: 'student' });
