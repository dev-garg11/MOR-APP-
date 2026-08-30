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
  const containerFadeAnim = useRef(new Animated.Value(1)).current;
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.95)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;
  const sloganFadeAnim = useRef(new Animated.Value(0)).current;
  const sloganSlideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Stage 1 & 2: Logo reveal with subtle 95% -> 100% scale (0 - 450ms)
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 3: Creative particles appear (350 - 750ms)
    Animated.timing(particlesAnim, {
      toValue: 1,
      duration: 400,
      delay: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Stage 4: Brand statement slide up & fade (450 - 900ms)
    Animated.parallel([
      Animated.timing(sloganFadeAnim, {
        toValue: 1,
        duration: 450,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sloganSlideAnim, {
        toValue: 0,
        duration: 450,
        delay: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 5: Smooth exit transition at ~1.25s
    const exitTimer = setTimeout(() => {
      handleExit();
    }, 1250);

    return () => clearTimeout(exitTimer);
  }, []);

  const handleExit = () => {
    Animated.parallel([
      Animated.timing(containerFadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  const particleFloatY = particlesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, -2],
  });

  return (
    <TouchableOpacity
      style={styles.touchContainer}
      activeOpacity={1}
      onPress={handleExit}
    >
      <Animated.View style={[styles.container, { opacity: containerFadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor="#090D16" translucent />

        {/* Ambient Subtle Studio Lighting */}
        <View style={styles.ambientGlow} />

        {/* Main Logo & Particles Stage */}
        <View style={styles.logoStage}>
          {/* Subtle Creative Badges Orbiting */}
          <Animated.View
            style={[
              styles.particlePill,
              styles.particleTopLeft,
              {
                opacity: particlesAnim,
                transform: [{ translateY: particleFloatY }],
              },
            ]}
          >
            <Text style={styles.particleText}>🎬 3D & Maya</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.particlePill,
              styles.particleTopRight,
              {
                opacity: particlesAnim,
                transform: [{ translateY: particleFloatY }],
              },
            ]}
          >
            <Text style={styles.particleText}>💥 VFX & Nuke</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.particlePill,
              styles.particleBottomLeft,
              {
                opacity: particlesAnim,
                transform: [{ translateY: particleFloatY }],
              },
            ]}
          >
            <Text style={styles.particleText}>🎮 Unreal 5</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.particlePill,
              styles.particleBottomRight,
              {
                opacity: particlesAnim,
                transform: [{ translateY: particleFloatY }],
              },
            ]}
          >
            <Text style={styles.particleText}>⚡ Tech</Text>
          </Animated.View>

          {/* Golden Studio Logo Badge */}
          <Animated.View
            style={[
              styles.logoBadge,
              {
                opacity: logoFadeAnim,
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <Text style={styles.logoText}>M</Text>
          </Animated.View>
        </View>

        {/* Brand Titles */}
        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: logoFadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>MORPH ACADEMY</Text>
          <Text style={styles.brandSub}>CREATIVE TECH & ANIMATION STUDIO</Text>
        </Animated.View>

        {/* Stage 4: Brand Statement */}
        <Animated.View
          style={[
            styles.sloganContainer,
            {
              opacity: sloganFadeAnim,
              transform: [{ translateY: sloganSlideAnim }],
            },
          ]}
        >
          <Text style={styles.sloganText}>
            Create. Learn. <Text style={{ color: theme.colors.primary }}>Build Your Future.</Text>
          </Text>
          <View style={styles.statusBarIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Studio Admissions Ready</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchContainer: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(245, 166, 35, 0.07)',
    top: '32%',
  },
  logoStage: {
    width: 220,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    color: '#090D16',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  particlePill: {
    position: 'absolute',
    backgroundColor: 'rgba(22, 32, 55, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  particleText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  particleTopLeft: {
    top: 4,
    left: 4,
  },
  particleTopRight: {
    top: 4,
    right: 4,
  },
  particleBottomLeft: {
    bottom: 6,
    left: 8,
  },
  particleBottomRight: {
    bottom: 6,
    right: 8,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandSub: {
    color: '#F5A623',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  sloganContainer: {
    alignItems: 'center',
    gap: 8,
  },
  sloganText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statusBarIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
});

