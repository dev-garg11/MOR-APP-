import { post } from '../apiClient';

// Backend: routes/payment_routes.py (prefix /payments)

/**
 * Creates a secure Razorpay order for the authenticated student.
 * @param {number|null} amountInPaise - optional amount in paise (if null/undefined, backend charges full pending dues)
 * @param {number|null} studentId - optional student ID
 */
export const createRazorpayOrder = (amountInPaise = null, studentId = null) =>
  post(
    '/payments/create-order',
    {
      amount: amountInPaise,
      student_id: studentId,
    },
    { auth: 'student' }
  );

/**
 * Cryptographically verifies payment signature on the backend and updates student fees.
 * @param {object} payload
 * @param {string} payload.razorpay_order_id
 * @param {string} payload.razorpay_payment_id
 * @param {string} payload.razorpay_signature
 * @param {number|null} payload.student_id
 */
export const verifyRazorpayPayment = (payload) =>
  post('/payments/verify', payload, { auth: 'student' });
