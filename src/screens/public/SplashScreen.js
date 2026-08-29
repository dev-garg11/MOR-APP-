import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

export function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 1.8 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Academy Logo */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>

        <Text style={styles.brandTitle}>MORPHY ACADEMY</Text>
        <Text style={styles.brandSub}>CREATIVE TECH & 3D STUDIO INSTITUTE</Text>

        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Initializing Studio Experience...</Text>
        </View>
      </Animated.View>

      <TouchableOpacity style={styles.skipBtn} onPress={onFinish}>
        <Text style={styles.skipBtnText}>Skip ➔</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...theme.shadows.glowPrimary,
  },
  logoText: {
    color: theme.colors.textDark,
    fontSize: 36,
    fontWeight: '900',
  },
  brandTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  brandSub: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 28,
  },
  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surfaceCard,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  skipBtn: {
    position: 'absolute',
    bottom: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});

