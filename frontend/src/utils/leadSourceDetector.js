import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { theme } from '../theme';

const STORAGE_KEY = '@morphy_lead_source_v1';

/**
 * Normalizes a raw source string into a clean enum.
 */
export function normalizeSource(rawSource = '') {
  const s = String(rawSource).trim().toLowerCase();
  if (!s) return 'website_direct';
  if (s.includes('insta')) return 'instagram';
  if (s.includes('youtu')) return 'youtube';
  if (s.includes('google') || s.includes('adwords') || s.includes('gads')) return 'google_ads';
  if (s.includes('whats') || s.includes('wa.me')) return 'whatsapp';
  if (s.includes('face') || s.includes('fb')) return 'facebook';
  if (s.includes('walk') || s.includes('offline') || s.includes('visit')) return 'offline_walkin';
  if (s.includes('friend') || s.includes('referral')) return 'referral';
  return s;
}

/**
 * Detects the lead source automatically on app load / web page view.
 */
export async function detectAndPersistLeadSource() {
  let detectedSource = 'website_direct';
  let utmCampaign = '';
  let utmMedium = '';
  let referrer = '';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const querySource = urlParams.get('source') || urlParams.get('utm_source');
      utmCampaign = urlParams.get('utm_campaign') || '';
      utmMedium = urlParams.get('utm_medium') || '';
      referrer = document.referrer || '';

      if (querySource) {
        detectedSource = normalizeSource(querySource);
      } else if (referrer) {
        const refLower = referrer.toLowerCase();
        if (refLower.includes('instagram.com')) {
          detectedSource = 'instagram';
        } else if (refLower.includes('youtube.com') || refLower.includes('youtu.be')) {
          detectedSource = 'youtube';
        } else if (refLower.includes('google.com') || refLower.includes('google.co.in')) {
          detectedSource = 'google_search';
        } else if (refLower.includes('facebook.com') || refLower.includes('fb.com')) {
          detectedSource = 'facebook';
        } else if (refLower.includes('wa.me') || refLower.includes('whatsapp.com')) {
          detectedSource = 'whatsapp';
        }
      }
    } catch (e) {
      console.warn('Lead source detection error:', e);
    }
  } else {
    // Mobile App default
    detectedSource = 'mobile_app';
  }

  const attributionData = {
    source: detectedSource,
    utmCampaign,
    utmMedium,
    referrer,
    capturedAt: new Date().toISOString(),
  };

  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(attributionData));
    }
  } catch (_e) {
    // Ignore storage errors
  }

  return attributionData;
}

/**
 * Retrieves the stored lead attribution data for form submission.
 */
export async function getStoredLeadSource() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (_e) {
    // Ignore storage errors
  }
  return { source: 'website_direct', utmCampaign: '', utmMedium: '', referrer: '' };
}

/**
 * Returns badge styling and icons for any source name in the CRM.
 */
export function getSourceBadgeConfig(rawSource = '') {
  const source = normalizeSource(rawSource);
  switch (source) {
    case 'instagram':
      return {
        label: 'Instagram',
        icon: '📷',
        color: theme.colors.sourceInstagram,
        bg: theme.colors.sourceInstagramBg,
      };
    case 'youtube':
      return {
        label: 'YouTube',
        icon: '▶️',
        color: theme.colors.sourceYouTube,
        bg: theme.colors.sourceYouTubeBg,
      };
    case 'google_ads':
    case 'google_search':
      return {
        label: source === 'google_ads' ? 'Google Ads' : 'Google Search',
        icon: '🔍',
        color: theme.colors.sourceGoogle,
        bg: theme.colors.sourceGoogleBg,
      };
    case 'whatsapp':
      return {
        label: 'WhatsApp',
        icon: '💬',
        color: theme.colors.sourceWhatsApp,
        bg: theme.colors.sourceWhatsAppBg,
      };
    case 'facebook':
      return {
        label: 'Facebook',
        icon: '👥',
        color: '#1877F2',
        bg: 'rgba(24, 119, 242, 0.15)',
      };
    case 'offline_walkin':
      return {
        label: 'Walk-In',
        icon: '🏢',
        color: theme.colors.primary,
        bg: theme.colors.primaryLight,
      };
    case 'referral':
      return {
        label: 'Referral',
        icon: '🤝',
        color: theme.colors.accentCyan,
        bg: theme.colors.accentCyanLight,
      };
    case 'mobile_app':
      return {
        label: 'Mobile App',
        icon: '📱',
        color: theme.colors.accentPurple,
        bg: theme.colors.accentPurpleLight,
      };
    default:
      return {
        label: 'Website Direct',
        icon: '🌐',
        color: theme.colors.sourceDirect,
        bg: theme.colors.sourceDirectBg,
      };
  }
}

