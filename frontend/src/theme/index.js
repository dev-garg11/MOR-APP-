export const theme = {
  colors: {
    // Modern Mixed Studio Palette (Rich Navy & Deep Dark Surfaces)
    background: '#090D16',
    backgroundAlt: '#0E1422',
    surface: '#121A2D',
    surfaceCard: '#162037',
    surfaceCardElevated: '#1D2A48',
    surfaceGlass: 'rgba(18, 26, 45, 0.90)',

    // Morph Golden Amber Primary Accent (#F5A623)
    primary: '#F5A623',
    primaryHover: '#E09315',
    primaryLight: 'rgba(245, 166, 35, 0.15)',
    primaryBorder: 'rgba(245, 166, 35, 0.40)',

    // Secondary Studio Accents
    accentSlate: '#38BDF8',
    accentSlateLight: 'rgba(56, 189, 248, 0.12)',
    accentCyan: '#06B6D4',
    accentCyanLight: 'rgba(6, 182, 212, 0.12)',
    accentPurple: '#A78BFA',
    accentPurpleLight: 'rgba(167, 139, 250, 0.12)',
    accentIndigo: '#6366F1',
    accentMuted: '#94A3B8',

    // Text Hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#8492A6',
    textDark: '#080B10',

    // Status Colors
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.15)',

    // Lead Source Badges
    sourceInstagram: '#E1306C',
    sourceInstagramBg: 'rgba(225, 48, 108, 0.15)',
    sourceYouTube: '#FF0000',
    sourceYouTubeBg: 'rgba(255, 0, 0, 0.15)',
    sourceGoogle: '#4285F4',
    sourceGoogleBg: 'rgba(66, 133, 244, 0.15)',
    sourceWhatsApp: '#25D366',
    sourceWhatsAppBg: 'rgba(37, 211, 102, 0.15)',
    sourceDirect: '#94A3B8',
    sourceDirectBg: 'rgba(148, 163, 184, 0.12)',

    // Borders
    border: 'rgba(255, 255, 255, 0.10)',
    borderLight: 'rgba(255, 255, 255, 0.18)',
    borderActive: '#F5A623',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    containerMaxWidth: 1240,
  },

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 6,
    },
    glowPrimary: {
      shadowColor: '#F5A623',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
  },
};
