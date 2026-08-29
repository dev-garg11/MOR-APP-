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

const FALLBACK_WEB_URL = 'http://localhost:8000';
const FALLBACK_ANDROID_EMULATOR_URL = 'http://10.0.2.2:8000'; // Android emulator special alias for host machine
const FALLBACK_IOS_SIMULATOR_URL = 'http://localhost:8000';

function resolveFallback() {
  if (Platform.OS === 'web') return FALLBACK_WEB_URL;
  if (Platform.OS === 'android') return FALLBACK_ANDROID_EMULATOR_URL;
  if (Platform.OS === 'ios') return FALLBACK_IOS_SIMULATOR_URL;
  return FALLBACK_WEB_URL;
}

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || resolveFallback()).replace(/\/$/, '');

export const IS_WEB = Platform.OS === 'web';

export const REQUEST_TIMEOUT_MS = 20000;
