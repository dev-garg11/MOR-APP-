import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginAdmin } from '../../services/endpoints';
import { theme } from '../../theme';

export function TeacherLoginScreen({ onLoginSuccess, onBackToHome }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both your Faculty Email / ID and Password.');
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
      onLoginSuccess(role);
    } catch (err) {
      setError(
        err.message || 'Invalid Faculty credentials. Please check with Super Admin / Reception.'
      );
    } finally {
      setLoading(false);
    }
  };

  const autofillTeacher1 = () => {
    setIdentifier('teacher@morphacademy.com');
    setPassword('Teacher@12345');
    setError('');
  };

  const autofillTeacher2 = () => {
    setIdentifier('other_teacher@morphacademy.com');
    setPassword('Teacher@12345');
    setError('');
  };

  const handleContactAdmin = () => {
    Linking.openURL(
      'https://wa.me/919876543210?text=Hi%20Super%20Admin%2C%20I%20am%20a%20faculty%20trainer%20and%20need%20my%20login%20password%20reset.'
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

        <Text style={styles.badge}>FACULTY ACCESS</Text>
        <Text style={styles.title}>Faculty & Trainer Portal</Text>
        <Text style={styles.subtitle}>
          Sign in to manage your assigned courses, batches, attendance, and assignments.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Faculty Email / Staff ID</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="e.g. teacher@morphacademy.com"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={handleContactAdmin}>
              <Text style={styles.forgotLinkText}>Need Help?</Text>
            </TouchableOpacity>
          </View>

          {/* Password Input with Show/Hide Toggle */}
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter faculty password"
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
              <Text style={styles.loginBtnText}>Sign In to Faculty Portal ➔</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Test Buttons */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>⚡ 1-Click Demo Accounts (Test Isolation):</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity style={styles.demoPill} onPress={autofillTeacher1}>
                <Text style={styles.demoPillText}>🧑‍🏫 Teacher 1 (Maya 3D)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoPill} onPress={autofillTeacher2}>
                <Text style={styles.demoPillText}>🎬 Teacher 2 (VFX Faculty)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.whatsappHelpBtn} onPress={handleContactAdmin}>
          <Text style={styles.whatsappHelpText}>
            💬 Faculty Support? Contact Super Admin on WhatsApp
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          Faculty accounts & cohort assignments are managed securely by Super Admin.
        </Text>
      </View>
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
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.shadows.glowPrimary,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.textDark,
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
  },
  passwordInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    marginTop: 6,
    ...theme.shadows.glowPrimary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
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
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  demoPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  whatsappHelpBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  whatsappHelpText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerHint: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
});

