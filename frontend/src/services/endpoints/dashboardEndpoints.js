import { get } from '../apiClient';

// Backend: routes/dashboard_routes.py (prefix /dashboard) — admin only.
// Returns totals (leads, students, fees/discount/paid/pending, overdue count),
// lead-status chart, student-course chart, 7-day attendance chart, recent leads.
export const getDashboardOverview = () => get('/dashboard/overview', { auth: 'admin' });
