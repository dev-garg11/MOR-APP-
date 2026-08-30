import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/env';
import { tokenStorage } from './tokenStorage';

export const buildUrl = (endpoint) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

/**
 * ApiError carries the HTTP status and parsed backend detail so screens can
 * show a real message instead of a generic "something went wrong".
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function extractErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  // FastAPI validation errors: { detail: [{ msg, loc, ... }, ...] }
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg || JSON.stringify(item)).join(', ');
  }
  // FastAPI HTTPException: { detail: "message" }
  if (typeof data.detail === 'string') return data.detail;
  if (data.message) return data.message;
  return fallback;
}

/**
 * Core request function used by every endpoint module.
 *
 * @param {string} endpoint - API path, e.g. '/students/'
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {object|null} payload - JSON body
 * @param {object} options
 * @param {'admin'|'student'|'none'} options.auth - which stored token to attach
 * @param {object} options.query - query string params
 */
export async function apiRequest(endpoint, method = 'GET', payload = null, options = {}) {
  const { auth = 'none', query = null, headers: extraHeaders = {} } = options;

  let url = buildUrl(endpoint);
  if (query && Object.keys(query).length) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { Accept: 'application/json', ...extraHeaders };
  if (payload !== null && payload !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth === 'admin') {
    const token = await tokenStorage.getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else if (auth === 'student') {
    const token = await tokenStorage.getStudentToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: payload !== null && payload !== undefined ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Check your internet connection and try again.', 0, null);
    }
    throw new ApiError(
      'Could not reach the server. Check that the backend is running and reachable from this device.',
      0,
      null
    );
  }
  clearTimeout(timeoutId);

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  try {
    data = contentType.includes('application/json') ? await response.json() : await response.text();
  } catch (_error) {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, `Request failed with status ${response.status}.`), response.status, data);
  }

  return { ok: true, status: response.status, data };
}

export const get = (endpoint, options) => apiRequest(endpoint, 'GET', null, options);
export const post = (endpoint, payload, options) => apiRequest(endpoint, 'POST', payload, options);
export const put = (endpoint, payload, options) => apiRequest(endpoint, 'PUT', payload, options);
export const del = (endpoint, options) => apiRequest(endpoint, 'DELETE', null, options);
