import { post } from '../apiClient';

// Backend: routes/payment_routes.py (prefix /payments)

/**
 * Creates a Razorpay order for a given amount (in paise, e.g. 500000 = ₹5,000).
 * Returns { order_id, amount, currency, key_id } to hand to the Razorpay checkout SDK.
 */
export const createRazorpayOrder = (amountInPaise) =>
  post(`/payments/create-order?amount=${encodeURIComponent(amountInPaise)}`, null);
