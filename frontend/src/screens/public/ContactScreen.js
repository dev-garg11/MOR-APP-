import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

export function ContactScreen({ onEnquire }) {
  const handleCall = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleWhatsApp = () => {
    Linking.openURL(
      'https://wa.me/919876543210?text=Hi%20Morph%20Academy%2C%20I%20would%20like%20to%20visit%20the%20campus%20and%20enquire%20about%20creative%20tech%20courses.'
    );
  };

  const handleEmail = () => {
    Linking.openURL('mailto:admissions@morphacademy.com');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.badge}>GET IN TOUCH</Text>
        <Text style={styles.title}>Contact Morph Academy</Text>
        <Text style={styles.subtitle}>
          Have questions about our syllabus, batches, or scholarships? Connect with our senior counselors today.
        </Text>
      </View>

      {/* Quick Action Channels */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCardWhatsApp} onPress={handleWhatsApp}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionTitleWhatsApp}>Chat on WhatsApp</Text>
          <Text style={styles.actionSubWhatsApp}>Instant counselor response</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleCall}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionTitle}>Call Admissions</Text>
          <Text style={styles.actionSub}>+91 98765 43210</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleEmail}>
          <Text style={styles.actionIcon}>✉️</Text>
          <Text style={styles.actionTitle}>Email Counselors</Text>
          <Text style={styles.actionSub}>admissions@morphacademy.com</Text>
        </TouchableOpacity>

        {/* Official Social Channels */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtnInsta}
            onPress={() =>
              Linking.openURL(
                'https://www.instagram.com/reel/DZaS-wxyHRN/?igsi=MW80aGprY2Jlc2l2ZA=='
              )
            }
          >
            <Text style={styles.socialBtnText}>📷 Watch on Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtnYoutube}
            onPress={() =>
              Linking.openURL('https://youtu.be/LFzsiom456g?si=-GiUXASfSS4vhyuM')
            }
          >
            <Text style={styles.socialBtnText}>▶️ Watch on YouTube</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campus Location & Hours */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Chandigarh Main Campus & Studios</Text>
        <Text style={styles.campusAddress}>
          Morph Academy — Creative Tech & Animation Studio,{'\n'}
          SCO 58-59, 2nd Floor, Sub. City Center, Sector 34-A,{'\n'}
          Chandigarh, 160022 (India)
        </Text>

        <View style={styles.divider} />

        <Text style={styles.hoursLabel}>🕒 ACADEMY & LAB TIMINGS</Text>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursDay}>Monday – Saturday:</Text>
          <Text style={styles.hoursTime}>9:00 AM – 7:30 PM</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursDay}>Sunday (Open Lab & Demo Classes):</Text>
          <Text style={styles.hoursTime}>10:00 AM – 4:00 PM</Text>
        </View>
      </View>

      {/* Direct Enquiry Trigger Card */}
      <View style={styles.enquiryCard}>
        <Text style={styles.enquiryBadge}>FREE CAREER COUNSELING</Text>
        <Text style={styles.enquiryTitle}>Ready to discuss your creative future?</Text>
        <Text style={styles.enquirySub}>
          Submit an online enquiry and receive a personalized course syllabus and scholarship estimate.
        </Text>

        <TouchableOpacity
          style={styles.enquiryBtn}
          onPress={() => onEnquire('General Admissions Enquiry')}
        >
          <Text style={styles.enquiryBtnText}>Open Enquiry Form ➔</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 14,
  },
  badge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsGrid: {
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 6,
  },
  actionCardWhatsApp: {
    backgroundColor: '#25D366',
    borderRadius: theme.radius.lg,
    padding: 18,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  actionTitleWhatsApp: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  actionSubWhatsApp: {
    color: '#E8F5E9',
    fontSize: 12,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtnInsta: {
    flex: 1,
    backgroundColor: '#E1306C',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  socialBtnYoutube: {
    flex: 1,
    backgroundColor: '#FF0000',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  campusAddress: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
  },
  hoursLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hoursDay: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  hoursTime: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  enquiryCard: {
    margin: 16,
    padding: 22,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  enquiryBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  enquiryTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  enquirySub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  enquiryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.radius.sm,
    ...theme.shadows.glowPrimary,
  },
  enquiryBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
});

