import { get, post, put, del } from '../apiClient';

// Backend: routes/lead_routes.py (prefix /leads)
// A "lead" is created when someone submits the public onboarding/enquiry form.

/**
 * Public: anyone can submit an enquiry — no auth required.
 * payload: { name, phone, email?, course_interest?, source?, notes? }
 */
export const createLead = (payload) => post('/leads/', payload);

export const listLeads = (query = {}) => get('/leads/', { auth: 'admin', query });

export const getLead = (leadId) => get(`/leads/${leadId}`, { auth: 'admin' });

export const getLeadStats = () => get('/leads/stats/overview', { auth: 'admin' });

export const getTodayFollowups = () => get('/leads/followups/today', { auth: 'admin' });

export const updateLead = (leadId, payload) => put(`/leads/${leadId}`, payload, { auth: 'admin' });

export const updateLeadStatus = (leadId, payload) =>
  put(`/leads/${leadId}/status`, payload, { auth: 'admin' });

export const addLeadNote = (leadId, note) =>
  post(`/leads/${leadId}/notes`, { note }, { auth: 'admin' });

export const deleteLead = (leadId) => del(`/leads/${leadId}`, { auth: 'admin' });
