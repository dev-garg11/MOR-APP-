import { Platform } from 'react-native';

/**
 * API base URL resolution.
 *
 * Priority order:
 *  1. EXPO_PUBLIC_API_BASE_URL from your .env file (works for web, Android, iOS).
 *  2. Sensible per-platform dev fallback.
 *
 * IMPORTANT (physical phone / Expo Go testing):
 * "localhost" only works on web and on an iOS simulator / Android emulator that
 * shares the host machine's network stack. A REAL PHONE running Expo Go cannot
 * reach "localhost" — it will try to reach itself, not your laptop.
 *
 * For real-device testing, set EXPO_PUBLIC_API_BASE_URL in a `.env` file at the
 * project root to your computer's LAN IP, e.g.:
 *
 *   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.14:8000
 *
 * Find your LAN IP with `ipconfig` (Windows) or `ifconfig`/`ip addr` (Mac/Linux).
 * Your phone and laptop must be on the same Wi-Fi network.
 */

const DEFAULT_BACKEND_URL = 'https://mor-app-backend.onrender.com';

function resolveFallback() {
  return DEFAULT_BACKEND_URL;
}

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || resolveFallback()).replace(/\/$/, '');

export const IS_WEB = Platform.OS === 'web';

export const REQUEST_TIMEOUT_MS = 20000;
