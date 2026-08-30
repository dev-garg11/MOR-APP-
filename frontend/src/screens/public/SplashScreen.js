import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

export function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const tagAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade and spring in the main logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous subtle glowing pulse for logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Tagline slide in
    Animated.timing(tagAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // 4. Progress bar fill from 0 to 100%
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 5. Auto-advance to home after 2.4s
    const timer = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => {
      pulseLoop.stop();
      clearTimeout(timer);
    };
  }, [fadeAnim, scaleAnim, pulseAnim, progressAnim, tagAnim, onFinish]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E17" translucent />

      {/* Ambient background glow */}
      <View style={styles.ambientGlow} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Glowing Logo */}
        <Animated.View
          style={[
            styles.logoBadge,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.logoText}>M</Text>
        </Animated.View>

        <Text style={styles.brandTitle}>MORPH ACADEMY</Text>
        <Text style={styles.brandSub}>CREATIVE TECH & 3D STUDIO INSTITUTE</Text>

        {/* Tech tags */}
        <Animated.View style={[styles.techTagsRow, { opacity: tagAnim }]}>
          <Text style={styles.techTag}>MAYA</Text>
          <Text style={styles.techDot}>•</Text>
          <Text style={styles.techTag}>UNREAL 5</Text>
          <Text style={styles.techDot}>•</Text>
          <Text style={styles.techTag}>NUKE</Text>
          <Text style={styles.techDot}>•</Text>
          <Text style={styles.techTag}>BLENDER</Text>
        </Animated.View>

        {/* Progress Bar Container */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.loadingText}>Initializing Studio Experience…</Text>
      </Animated.View>

      <TouchableOpacity style={styles.skipBtn} onPress={onFinish} activeOpacity={0.7}>
        <Text style={styles.skipBtnText}>Skip Intro ➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ambientGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    top: '30%',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logoText: {
    color: '#0A0E17',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandSub: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  techTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  techTag: {
    color: '#8A99AD',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  techDot: {
    color: '#F5A623',
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarBg: {
    width: 200,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 2,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 36 : 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderColor: theme.colors.border,
  },
  skipBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});

