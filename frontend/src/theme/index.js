export const theme = {
  colors: {
    // Elegant Matte Dark Palette (Apple / Linear / Studio aesthetic)
    background: '#090C10',
    surface: '#0E131B',
    surfaceCard: '#131924',
    surfaceCardElevated: '#1A2232',
    surfaceGlass: 'rgba(14, 19, 27, 0.90)',

    // Refined Warm Amber / Gold Primary Accent (Subtle & High-End)
    primary: '#E5A93C',
    primaryHover: '#D4962B',
    primaryLight: 'rgba(229, 169, 60, 0.10)',
    primaryBorder: 'rgba(229, 169, 60, 0.30)',

    // Secondary Subtle Accents (Minimalist & Non-Distracting)
    accentSlate: '#38BDF8',
    accentSlateLight: 'rgba(56, 189, 248, 0.08)',
    accentCyan: '#38BDF8',
    accentCyanLight: 'rgba(56, 189, 248, 0.08)',
    accentPurple: '#A78BFA',
    accentPurpleLight: 'rgba(167, 139, 250, 0.08)',
    accentMuted: '#94A3B8',

    // Text Hierarchy
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textDark: '#090C10',

    // Status Colors (Subtle)
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.12)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.12)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.12)',

    // Lead Source Badges
    sourceInstagram: '#E1306C',
    sourceInstagramBg: 'rgba(225, 48, 108, 0.12)',
    sourceYouTube: '#FF0000',
    sourceYouTubeBg: 'rgba(255, 0, 0, 0.12)',
    sourceGoogle: '#4285F4',
    sourceGoogleBg: 'rgba(66, 133, 244, 0.12)',
    sourceWhatsApp: '#25D366',
    sourceWhatsAppBg: 'rgba(37, 211, 102, 0.12)',
    sourceDirect: '#94A3B8',
    sourceDirectBg: 'rgba(148, 163, 184, 0.10)',

    // Borders
    border: 'rgba(255, 255, 255, 0.07)',
    borderLight: 'rgba(255, 255, 255, 0.12)',
    borderActive: '#E5A93C',
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
      shadowColor: '#E5A93C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 8,
    },
  },
};
