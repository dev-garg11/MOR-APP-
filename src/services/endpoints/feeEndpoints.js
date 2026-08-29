import { get, post, put, del } from '../apiClient';

// Backend: routes/fee_routes.py (prefix /fees)

/**
 * Update a student's total fee, discount, or due date.
 * payload: { fees_total?, discount_amount?, fee_due_date? }
 */
export const updateFeePlan = (studentId, payload) =>
  put(`/fees/student/${studentId}/plan`, payload, { auth: 'admin' });

/**
 * Record a new payment (used for EMI installments and one-off payments alike).
 * payload: { student_id, amount, payment_date?, payment_mode?, notes? }
 */
export const createFeePayment = (payload) => post('/fees/payments', payload, { auth: 'admin' });

export const updateFeePayment = (paymentId, payload) =>
  put(`/fees/payments/${paymentId}`, payload, { auth: 'admin' });

export const deleteFeePayment = (paymentId) =>
  del(`/fees/payments/${paymentId}`, { auth: 'admin' });

/**
 * Full fee summary for one student: total, discount, payable, paid, pending,
 * due date, status, and full payment history — everything needed for an
 * EMI / installment view.
 */
export const getStudentFeeSummary = (studentId) =>
  get(`/fees/student/${studentId}`, { auth: 'admin' });

/**
 * All students with pending/overdue fees.
 */
export const listPendingFees = () => get('/fees/pending', { auth: 'admin' });
