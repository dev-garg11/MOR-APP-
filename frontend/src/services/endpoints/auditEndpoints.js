import { get } from '../apiClient';

// Backend: GET /dashboard/audit-trail — Super Admin only.
// "Who did what, when" feed: [{ id, actor_name, actor_role, action, entity_type, entity_id, details, created_at }]
export const getAuditTrail = (limit = 50) => get('/dashboard/audit-trail', { auth: 'admin', query: { limit } });
