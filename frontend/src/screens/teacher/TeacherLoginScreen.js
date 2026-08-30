import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { loginAdmin } from '../../services/endpoints';
import { theme } from '../../theme';

export function TeacherLoginScreen({ onLoginSuccess, onBackToHome }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isIdFocused, setIsIdFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState('');

  // Animation values
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(18)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const leftVisualFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(leftVisualFadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerErrorShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both your Faculty Email / ID and Password.');
      triggerErrorShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginAdmin({
        email: identifier.trim(),
        password: password.trim(),
      });

      const role = String(res?.admin?.role || res?.role || 'teacher').toLowerCase();
      
      setLoginSuccess(true);
      setTimeout(() => {
        onLoginSuccess(role);
      }, 350);
    } catch (err) {
      setError(
        err.message || 'Invalid Faculty credentials. Please check with Super Admin / Reception.'
      );
      triggerErrorShake();
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    Linking.openURL(
      'https://wa.me/919876543210?text=Hi%20Super%20Admin%2C%20I%20am%20a%20faculty%20trainer%20and%20need%20my%20login%20password%20reset.'
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
        
        {/* Left / Visual Side — Desktop Only */}
        {isDesktop && (
          <Animated.View style={[styles.visualSide, { opacity: leftVisualFadeAnim }]}>
            <View style={styles.visualHeader}>
              <View style={styles.visualBadge}>
                <Text style={styles.visualBadgeText}>M</Text>
              </View>
              <View>
                <Text style={styles.visualTitle}>FACULTY WORKSPACE</Text>
                <Text style={styles.visualSub}>STUDIO INSTRUCTOR PORTAL</Text>
              </View>
            </View>

            <View style={styles.visualCenter}>
              <Text style={styles.visualHeroHeadline}>
                Mentor & Classroom Command Center
              </Text>
              <Text style={styles.visualHeroDesc}>
                Take daily student attendance, assign 3D/VFX production exercises, review student assignments, and conduct batch evaluations.
              </Text>

              <View style={styles.visualTagsGrid}>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>📅 Class Attendance</Text>
                </View>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>📚 Course Timetables</Text>
                </View>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>📝 Project Grading</Text>
                </View>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>🎓 Student Batches</Text>
                </View>
              </View>
            </View>

            <View style={styles.visualFooter}>
              <View style={styles.telemetryRow}>
                <View style={styles.telemetryDot} />
                <Text style={styles.telemetryText}>Faculty Terminal Online</Text>
              </View>
              <Text style={styles.telemetryCampus}>Morph Academy Chandigarh • Sector 34-A</Text>
            </View>
          </Animated.View>
        )}

        {/* Right / Login Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFadeAnim,
              transform: [{ translateY: cardSlideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={onBackToHome} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Back to Website</Text>
          </TouchableOpacity>

          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>M</Text>
          </View>

          <Text style={styles.badge}>FACULTY ACCESS</Text>
          <Text style={styles.title}>Faculty Sign In</Text>
          <Text style={styles.subtitle}>
            Sign in to manage assigned courses, batches, attendance & assignments.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Faculty Email / Staff ID</Text>
            <TextInput
              style={[styles.input, isIdFocused && styles.inputFocused]}
              value={identifier}
              onChangeText={(txt) => {
                setIdentifier(txt);
                if (error) setError('');
              }}
              onFocus={() => setIsIdFocused(true)}
              onBlur={() => setIsIdFocused(false)}
              placeholder="e.g. teacher@morphacademy.com"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={handleContactAdmin} activeOpacity={0.7}>
                <Text style={styles.forgotLinkText}>Need Help?</Text>
              </TouchableOpacity>
            </View>

            {/* Password Input with Show/Hide Toggle */}
            <View
              style={[
                styles.passwordInputContainer,
                isPassFocused && styles.inputFocused,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (error) setError('');
                }}
                onFocus={() => setIsPassFocused(true)}
                onBlur={() => setIsPassFocused(false)}
                placeholder="Enter faculty password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈 Hide' : '👁 Show'}</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.loginBtn,
                loading && styles.btnDisabled,
                loginSuccess && styles.loginBtnSuccess,
              ]}
              onPress={handleLogin}
              disabled={loading || loginSuccess}
              activeOpacity={0.85}
            >
              {loginSuccess ? (
                <Text style={styles.loginBtnText}>✓ Access Granted</Text>
              ) : loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={theme.colors.textDark} size="small" />
                  <Text style={styles.loginBtnText}>Signing you in…</Text>
                </View>
              ) : (
                <Text style={styles.loginBtnText}>Sign In to Faculty Portal ➔</Text>
              )}
            </TouchableOpacity>

            {/* 1-Click Demo Accounts */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>⚡ 1-Click Demo Faculty Accounts:</Text>
              <View style={styles.demoBtnRow}>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => {
                    setIdentifier('teacher@morphacademy.com');
                    setPassword('Teacher@12345');
                    setError('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoPillText}>🧑‍🏫 Senior Mentor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => {
                    setIdentifier('other_teacher@morphacademy.com');
                    setPassword('Teacher@12345');
                    setError('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoPillText}>🧑‍🏫 Lab Trainer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.whatsappHelpBtn}
            onPress={handleContactAdmin}
            activeOpacity={0.7}
          >
            <Text style={styles.whatsappHelpText}>
              💬 Need login assistance? Contact Super Admin on WhatsApp
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 440,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainWrapperDesktop: {
    maxWidth: 960,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#0E1422',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  visualSide: {
    flex: 1.1,
    backgroundColor: '#121A2D',
    padding: 36,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visualBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  visualBadgeText: {
    color: '#090D16',
    fontSize: 22,
    fontWeight: '900',
  },
  visualTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  visualSub: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  visualCenter: {
    marginVertical: 28,
  },
  visualHeroHeadline: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 10,
  },
  visualHeroDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  visualTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visualTagPill: {
    backgroundColor: 'rgba(22, 32, 55, 0.90)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  visualTagText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  visualFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    gap: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
  },
  telemetryText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
  },
  telemetryCampus: {
    color: '#64748B',
    fontSize: 11,
  },
  card: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#141C2E',
    borderRadius: theme.radius.lg,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: theme.colors.textDark,
    fontSize: 24,
    fontWeight: '900',
  },
  badge: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 17,
  },
  form: {
    width: '100%',
    gap: 10,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLinkText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  inputFocused: {
    borderColor: '#A78BFA',
    backgroundColor: '#182238',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  eyeText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnSuccess: {
    backgroundColor: '#10B981',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  demoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 6,
  },
  demoTitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  demoPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  whatsappHelpBtn: {
    marginTop: 14,
    paddingVertical: 6,
  },
  whatsappHelpText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: theme.colors.dangerLight,
    padding: 8,
    borderRadius: theme.radius.xs,
  },
});
