import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginAdmin } from '../../services/endpoints';
import { theme } from '../../theme';

export function AdminLoginScreen({ onLoginSuccess, onBackToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals for Forgot Password & Add New Admin Info
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [newAdminModalVisible, setNewAdminModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
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
      onLoginSuccess(role);
    } catch (err) {
      setError(
        err.message || 'Invalid admin credentials or server offline. Please try again.'
      );
    } finally {
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
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToHome}>
          <Text style={styles.backBtnText}>← Back to Website</Text>
        </TouchableOpacity>

        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>

        <Text style={styles.badge}>HR & ADMISSIONS DESK</Text>
        <Text style={styles.title}>HR & Admissions Portal</Text>
        <Text style={styles.subtitle}>
          Sign in to manage student admissions, leads CRM, batches, courses & fee installments.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>HR Counselor / Staff Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. hr@morphacademy.com or admin@morphacademy.com"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Password Input with Show/Hide Toggle */}
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter secure password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? '🙈 Hide' : '👁 Show'}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textDark} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In to HR Portal ➔</Text>
            )}
          </TouchableOpacity>

          {/* 1-Click Demo Fill Helpers */}
          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={() => {
              setEmail('hr@morphacademy.com');
              setPassword('Hr@12345');
            }}
          >
            <Text style={styles.quickFillText}>
              🎯 Auto-fill HR Counselor (hr@morphacademy.com / Hr@12345)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFillBtn, { borderColor: theme.colors.primaryBorder }]}
            onPress={() => {
              setEmail('admin@morphacademy.com');
              setPassword('Admin@12345');
            }}
          >
            <Text style={[styles.quickFillText, { color: theme.colors.primary }]}>
              🔑 Auto-fill Super Admin (admin@morphacademy.com / Admin@12345)
            </Text>
          </TouchableOpacity>

          {/* How to add new admin button */}
          <TouchableOpacity
            style={styles.newAdminHelperBtn}
            onPress={() => setNewAdminModalVisible(true)}
          >
            <Text style={styles.newAdminHelperText}>
              ➕ How to add new HR / Counselor accounts?
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerHint}>
          Default Login: admin@morphacademy.com | Password: Admin@12345
        </Text>
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

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleForgotSubmit}>
              <Text style={styles.modalPrimaryBtnText}>Send Reset Link ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalWhatsAppBtn}
              onPress={() =>
                Linking.openURL(
                  'https://wa.me/919876543210?text=Hi%20Super%20Admin%2C%20I%20need%20to%20reset%20my%20Morph%20Academy%20staff%20account%20password.'
                )
              }
            >
              <Text style={styles.modalWhatsAppText}>💬 Contact Super Admin on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setForgotModalVisible(false);
                setForgotMessage('');
              }}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. HOW TO ADD NEW ADMIN / STAFF GUIDE MODAL */}
      <Modal visible={newAdminModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>👥 Adding New Staff & Admins</Text>
            <Text style={styles.modalSub}>
              Future me jab bhi aapko naye staff (Counselor, Trainer, Admin) ko access dena ho:
            </Text>

            <View style={styles.guideStep}>
              <Text style={styles.guideStepNum}>1</Text>
              <Text style={styles.guideStepText}>
                <Text style={{ fontWeight: '800', color: theme.colors.primary }}>Super Admin Login:</Text>{' '}
                Apne Super Admin account (`admin@morphacademy.com`) se sign-in karein.
              </Text>
            </View>

            <View style={styles.guideStep}>
              <Text style={styles.guideStepNum}>2</Text>
              <Text style={styles.guideStepText}>
                <Text style={{ fontWeight: '800', color: theme.colors.primary }}>Direct API / DB Script:</Text>{' '}
                Backend folder me `python reset_admin.py` chala kar naye staff ka Name, Email, Role, aur Password turant create ya reset kar sakte hain.
              </Text>
            </View>

            <View style={styles.guideStep}>
              <Text style={styles.guideStepNum}>3</Text>
              <Text style={styles.guideStepText}>
                <Text style={{ fontWeight: '800', color: theme.colors.primary }}>1-Click WhatsApp Credentials:</Text>{' '}
                Naye staff ko unka email aur password direct WhatsApp ya email par bhej dein.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setNewAdminModalVisible(false)}
            >
              <Text style={styles.modalPrimaryBtnText}>Got it! Close Guide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    width: '100%',
    gap: 12,
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
    marginTop: 8,
    ...theme.shadows.glowPrimary,
  },
  loginBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  quickFillBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
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
    paddingVertical: 6,
    alignItems: 'center',
  },
  newAdminHelperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  footerHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
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
