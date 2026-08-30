import { post } from '../apiClient';

// Backend: routes/chat_routes.py (prefix /chat)
// payload: { message, name?, phone? } -> { reply, lead_captured }
export const sendChatMessage = (payload) => post('/chat/', payload);
