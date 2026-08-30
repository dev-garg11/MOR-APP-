import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';
import { getSourceBadgeConfig } from '../../utils/leadSourceDetector';

export function LeadStatusBadge({ status = 'new' }) {
  const normalized = String(status).toLowerCase();
  
  let bg = theme.colors.infoLight;
  let color = theme.colors.info;
  let label = 'New Lead';

  switch (normalized) {
    case 'new':
      bg = 'rgba(59, 130, 246, 0.15)';
      color = '#60A5FA';
      label = '● New Enquiry';
      break;
    case 'contacted':
      bg = 'rgba(245, 158, 11, 0.15)';
      color = '#FBBF24';
      label = '● Contacted';
      break;
    case 'demo_booked':
    case 'demo':
      bg = 'rgba(179, 136, 255, 0.15)';
      color = '#C084FC';
      label = '● Demo Booked';
      break;
    case 'enrolled':
    case 'admitted':
      bg = 'rgba(16, 185, 129, 0.15)';
      color = '#34D399';
      label = '✓ Enrolled';
      break;
    case 'lost':
    case 'rejected':
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#F87171';
      label = '✕ Closed / Lost';
      break;
    default:
      label = status;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function LeadSourceBadge({ source = 'website_direct' }) {
  const config = getSourceBadgeConfig(source);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.color }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.icon} {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

