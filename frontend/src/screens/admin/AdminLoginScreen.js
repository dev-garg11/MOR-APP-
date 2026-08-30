import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Modal,
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

export function AdminLoginScreen({ onLoginSuccess, onBackToHome }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState('');

  // Modals for Forgot Password & Add New Admin Info
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [newAdminModalVisible, setNewAdminModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Animation values
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(18)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const leftVisualFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth Card Entrance Animation
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
    if (!email.trim() || !password.trim()) {
      setError('Please enter both staff email and password.');
      triggerErrorShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginAdmin({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      const role = res?.data?.admin?.role?.toLowerCase() || 'admin';
      
      // Success button transition (350ms)
      setLoginSuccess(true);
      setTimeout(() => {
        onLoginSuccess(role);
      }, 350);
    } catch (err) {
      setError(
        err.message || 'Invalid staff credentials or server unreachable. Please try again.'
      );
      triggerErrorShake();
      setLoading(false);
    }
  };

  const handleForgotSubmit = () => {
    if (!forgotEmail.trim()) {
      setForgotMessage('Please enter your registered staff email.');
      return;
    }
    setForgotMessage(
      `Password reset instructions have been dispatched to ${forgotEmail}. You can also contact the Super Admin directly via WhatsApp.`
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
                <Text style={styles.visualTitle}>MORPH ACADEMY</Text>
                <Text style={styles.visualSub}>CREATIVE TECH & 3D STUDIO</Text>
              </View>
            </View>

            <View style={styles.visualCenter}>
              <Text style={styles.visualHeroHeadline}>
                Admissions & Management Portal
              </Text>
              <Text style={styles.visualHeroDesc}>
                Empowering counselors, academic coordinators, and administration with real-time leads CRM, batch allocation, and fee management.
              </Text>

              {/* Studio Tags Grid */}
              <View style={styles.visualTagsGrid}>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>🎬 3D Animation & Maya</Text>
                </View>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>💥 Cinematic VFX & Nuke</Text>
                </View>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>🎮 Unreal Engine 5</Text>
                </View>
                <View style={styles.visualTagPill}>
                  <Text style={styles.visualTagText}>🎨 UI/UX & Web</Text>
                </View>
              </View>
            </View>

            <View style={styles.visualFooter}>
              <View style={styles.telemetryRow}>
                <View style={styles.telemetryDot} />
                <Text style={styles.telemetryText}>Admissions Cloud Active • ISO 9001:2015</Text>
              </View>
              <Text style={styles.telemetryCampus}>Chandigarh Campus (SCO 58-59, Sector 34-A)</Text>
            </View>
          </Animated.View>
        )}

        {/* Right / Login Card Side */}
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

          <Text style={styles.badge}>HR & ADMISSIONS DESK</Text>
          <Text style={styles.title}>Staff Portal Login</Text>
          <Text style={styles.subtitle}>
            Sign in to manage student admissions, leads CRM, batches, courses & fees.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Staff Email Address</Text>
            <TextInput
              style={[
                styles.input,
                isEmailFocused && styles.inputFocused,
              ]}
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (error) setError('');
              }}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              placeholder="e.g. hr@morphacademy.com"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => setForgotModalVisible(true)} activeOpacity={0.7}>
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Password Input with Show/Hide Toggle */}
            <View
              style={[
                styles.passwordInputContainer,
                isPasswordFocused && styles.inputFocused,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (error) setError('');
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="Enter secure password"
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
                <Text style={styles.loginBtnText}>Sign In to Admissions Portal ➔</Text>
              )}
            </TouchableOpacity>

            {/* 1-Click Demo Fill Helpers */}
            <TouchableOpacity
              style={styles.quickFillBtn}
              onPress={() => {
                setEmail('hr@morphacademy.com');
                setPassword('Hr@12345');
                setError('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.quickFillText}>
                🎯 1-Click Fill: HR Counselor (hr@morphacademy.com)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickFillBtn, { borderColor: theme.colors.primaryBorder }]}
              onPress={() => {
                setEmail('admin@morphacademy.com');
                setPassword('Admin@12345');
                setError('');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickFillText, { color: theme.colors.primary }]}>
                🔑 1-Click Fill: Super Admin (admin@morphacademy.com)
              </Text>
            </TouchableOpacity>

            {/* How to add new admin button */}
            <TouchableOpacity
              style={styles.newAdminHelperBtn}
              onPress={() => setNewAdminModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.newAdminHelperText}>
                ➕ How to add new HR / Counselor accounts?
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerHint}>
            Default Super Admin: admin@morphacademy.com | Pass: Admin@12345
          </Text>
        </Animated.View>
      </View>

      {/* 1. FORGOT PASSWORD MODAL */}
      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔒 Reset Staff Password</Text>
            <Text style={styles.modalSub}>
              Enter your registered staff email address to receive reset instructions or contact
              Super Admin support.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              placeholder="e.g. counselor@morphacademy.com"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {forgotMessage ? <Text style={styles.modalSuccessText}>{forgotMessage}</Text> : null}

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleForgotSubmit} activeOpacity={0.8}>
              <Text style={styles.modalPrimaryBtnText}>Send Reset Link ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalWhatsAppBtn}
              onPress={() =>
                Linking.openURL(
                  'https://wa.me/919876543210?text=Hi%20Super%20Admin%2C%20I%20am%20a%20staff%20counselor%20and%20need%20my%20password%20reset.'
                )
              }
              activeOpacity={0.8}
            >
              <Text style={styles.modalWhatsAppText}>💬 WhatsApp Super Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setForgotModalVisible(false);
                setForgotMessage('');
                setForgotEmail('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. ADD NEW ADMIN / COUNSELOR GUIDE MODAL */}
      <Modal visible={newAdminModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 480 }]}>
            <Text style={styles.modalTitle}>➕ Onboarding New Staff</Text>
            <Text style={styles.modalSub}>
              To create new Counselor, Receptionist, or Faculty logins:
            </Text>

            <View style={styles.guideStep}>
              <Text style={styles.guideStepNum}>1</Text>
              <Text style={styles.guideStepText}>
                Log in as <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Super Admin</Text> using admin@morphacademy.com.
              </Text>
            </View>

            <View style={styles.guideStep}>
              <Text style={styles.guideStepNum}>2</Text>
              <Text style={styles.guideStepText}>
                Go to the <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>HR & Enquiries</Text> or <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Faculty</Text> tab.
              </Text>
            </View>

            <View style={styles.guideStep}>
              <Text style={styles.guideStepNum}>3</Text>
              <Text style={styles.guideStepText}>
                Click <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>➕ Onboard New Staff / Trainer</Text> to issue verified logins.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: 10 }]}
              onPress={() => setNewAdminModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalPrimaryBtnText}>Got it, Close Guide ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
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
    color: '#F5A623',
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
    backgroundColor: '#10B981',
  },
  telemetryText: {
    color: '#10B981',
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
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...theme.shadows.glowPrimary,
  },
  logoText: {
    color: theme.colors.textDark,
    fontSize: 24,
    fontWeight: '900',
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
    color: theme.colors.primary,
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
    borderColor: theme.colors.primary,
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
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    ...theme.shadows.glowPrimary,
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
  quickFillBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginTop: 4,
  },
  quickFillText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  newAdminHelperBtn: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  newAdminHelperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
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
  footerHint: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  modalSuccessText: {
    color: theme.colors.success,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.successLight,
    padding: 10,
    borderRadius: theme.radius.xs,
  },
  modalPrimaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPrimaryBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  modalWhatsAppBtn: {
    backgroundColor: '#25D366',
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalWhatsAppText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalCloseBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  guideStep: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  guideStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    color: theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '900',
  },
  guideStepText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
