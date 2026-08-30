import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

const SLIDES = [
  {
    badge: 'STUDIO-GRADE TRAINING',
    title: 'Master 3D, VFX &\nUnreal Engine 5',
    description:
      'Learn production pipelines designed with top animation studios and game development leads.',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&auto=format&fit=crop&q=80',
  },
  {
    badge: '100% PRODUCTION PROJECTS',
    title: 'Build Broadcast-Ready\nShowreels',
    description:
      'Work on real shots, character rigging, and Unreal Engine gameplay prototypes on RTX 4090 workstations.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=80',
  },
  {
    badge: 'CAREER & PLACEMENTS',
    title: 'Get Hired by Global\nCreative Studios',
    description:
      'Direct placement assistance with studios like Ubisoft, Framestore, Rockstar Games, MPC, and Technicolor.',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=700&auto=format&fit=crop&q=80',
  },
];

export function OnboardingScreen({ onFinish }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>M</Text>
          </View>
          <Text style={styles.brandName}>MORPH ACADEMY</Text>
        </View>

        <TouchableOpacity onPress={onFinish} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Card */}
      <View style={styles.slideCard}>
        <View style={styles.imageBox}>
          <Image source={{ uri: slide.image }} style={styles.slideImage} />
        </View>

        <View style={styles.contentBox}>
          <Text style={styles.badge}>{slide.badge}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </View>

      {/* Footer Indicators & Next button */}
      <View style={styles.footer}>
        <View style={styles.indicatorRow}>
          {SLIDES.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.indicatorDot,
                currentSlide === idx && styles.indicatorDotActive,
              ]}
              onPress={() => setCurrentSlide(idx)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>
            {currentSlide === SLIDES.length - 1 ? 'Get Started ➔' : 'Next ➔'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLogo: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '900',
  },
  brandName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  slideCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  imageBox: {
    width: '100%',
    maxWidth: 420,
    height: 240,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'flex-start',
  },
  badge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 10,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceCardElevated,
  },
  indicatorDotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: theme.radius.sm,
    ...theme.shadows.glowPrimary,
  },
  primaryBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
});

