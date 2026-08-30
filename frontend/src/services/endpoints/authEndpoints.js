import { post } from '../apiClient';
import { tokenStorage } from '../tokenStorage';

/**
 * Logs an admin/staff member in and persists the session automatically.
 * Backend: POST /auth/login -> { access_token, token_type, admin }
 */
export async function loginAdmin({ email, password }) {
  const response = await post('/auth/login', { email, password });
  if (response.ok && response.data?.access_token) {
    await tokenStorage.setAdminSession(response.data.access_token, response.data.admin);
  }
  return response;
}

/**
 * Creates a new staff/admin account. Only an existing admin can create more
 * staff (backend enforces this once the first admin exists).
 * Backend: POST /auth/signup -> { access_token, token_type, admin }
 * role: 'admin' | 'counselor' | 'trainer'
 */
export async function signupAdmin({ name, email, password, role = 'counselor' }) {
  return post('/auth/signup', { name, email, password, role }, { auth: 'admin' });
}

export async function logoutAdmin() {
  await tokenStorage.clearAdminSession();
}

export async function getStoredAdmin() {
  return tokenStorage.getAdminProfile();
}
