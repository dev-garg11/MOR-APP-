import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ACADEMY_FACILITIES, ACADEMY_FACULTY } from '../../data/coursesData';
import { theme } from '../../theme';

export function AboutFacilitiesScreen({ onEnquire }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.badge}>INSTITUTE OVERVIEW</Text>
        <Text style={styles.title}>About Morphy Academy</Text>
        <Text style={styles.subtitle}>
          Pioneering next-generation animation, VFX, and game design education with 100% production-driven training.
        </Text>
      </View>

      {/* 1. Core Mission & Why Choose Us */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Why Study at Morphy?</Text>
        <View style={styles.pointsList}>
          {[
            {
              icon: '🏆',
              title: '12+ Years Industry Legacy',
              desc: 'Over 5,000 alumni working in top gaming and animation studios worldwide.',
            },
            {
              icon: '🎯',
              title: '100% Practical Production Projects',
              desc: 'Zero boring theory. Work on real film CGI shots, 3D character rigs, and playable Unreal Engine levels.',
            },
            {
              icon: '💎',
              title: 'Studio Mentors from DreamWorks & Ubisoft',
              desc: 'Learn directly from senior VFX supervisors and technical artists.',
            },
            {
              icon: '💳',
              title: '0% Interest No-Cost EMI Plans',
              desc: 'Accessible quality education with flexible transparent installment options.',
            },
          ].map((item) => (
            <View key={item.title} style={styles.pointItem}>
              <Text style={styles.pointIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{item.title}</Text>
                <Text style={styles.pointDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 2. World-Class Facilities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>World-Class Facilities & Labs</Text>
        <Text style={styles.cardSub}>
          Equipped with the same cutting-edge hardware and software used in Hollywood production studios.
        </Text>

        <View style={styles.facilitiesGrid}>
          {ACADEMY_FACILITIES.map((f) => (
            <View key={f.title} style={styles.facilityBox}>
              <Text style={styles.facilityIcon}>{f.icon}</Text>
              <Text style={styles.facilityTitle}>{f.title}</Text>
              <Text style={styles.facilityDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Trainers & Faculty Preview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meet Senior Faculty & Mentors</Text>
        <Text style={styles.cardSub}>Industry veterans guiding your showreel production:</Text>

        <View style={styles.facultyList}>
          {ACADEMY_FACULTY.map((faculty) => (
            <View key={faculty.name} style={styles.facultyCard}>
              <Image source={{ uri: faculty.avatar }} style={styles.facultyAvatar} />
              <View style={styles.facultyInfo}>
                <Text style={styles.facultyName}>{faculty.name}</Text>
                <Text style={styles.facultyRole}>{faculty.role}</Text>
                <Text style={styles.facultyExp}>{faculty.experience}</Text>
                <Text style={styles.facultyTools}>🛠 {faculty.tools}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Card */}
      <View style={styles.ctaBox}>
        <Text style={styles.ctaTitle}>Visit Our Campus & Experience The Lab</Text>
        <Text style={styles.ctaSub}>
          Book a free 1-on-1 counseling session and try out our RTX 4090 workstations.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => onEnquire('Campus Visit & Lab Demo')}
        >
          <Text style={styles.ctaBtnText}>Book Free Lab Demo ➔</Text>
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
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 20,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  pointsList: {
    gap: 16,
    marginTop: 8,
  },
  pointItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  pointIcon: {
    fontSize: 24,
  },
  pointTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  pointDesc: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  facilitiesGrid: {
    gap: 12,
  },
  facilityBox: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  facilityIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  facilityTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  facilityDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  facultyList: {
    gap: 12,
  },
  facultyCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 14,
  },
  facultyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceCard,
  },
  facultyInfo: {
    flex: 1,
  },
  facultyName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  facultyRole: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  facultyExp: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  facultyTools: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },
  ctaBox: {
    margin: 16,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    alignItems: 'center',
  },
  ctaTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    ...theme.shadows.glowPrimary,
  },
  ctaBtnText: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '800',
  },
});

