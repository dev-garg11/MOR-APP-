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
import { loginStudent } from '../../services/endpoints';
import { theme } from '../../theme';

export function StudentLoginScreen({ onLoginSuccess, onBackToHome }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!loginId.trim() || !password.trim()) {
      setError('Please enter both your Student ID and Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginStudent({
        loginId: loginId.trim().toUpperCase(),
        password: password.trim(),
      });
      onLoginSuccess();
    } catch (err) {
      setError(
        err.message || 'Invalid Student ID or Password. Check credentials with reception.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStudentPass = () => {
    Linking.openURL(
      'https://wa.me/919876543210?text=Hi%20Morphy%20Academy%2C%20I%20am%20an%20enrolled%20student%20and%20need%20my%20Student%20ID%20or%20Password%20reset.'
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

        <Text style={styles.badge}>MY MORPHY</Text>
        <Text style={styles.title}>Student Self-Service Portal</Text>
        <Text style={styles.subtitle}>
          Sign in to check attendance, fee installments, and class notices.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Student ID / Roll No</Text>
          <TextInput
            style={styles.input}
            value={loginId}
            onChangeText={setLoginId}
            placeholder="e.g. STU-00001"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={handleForgotStudentPass}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Password Input with Show/Hide Toggle */}
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password issued by academy"
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
              <Text style={styles.loginBtnText}>Sign In to My Morphy ➔</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Test Buttons */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>⚡ 1-Click Demo Accounts:</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => {
                  setLoginId('MA-2026-001');
                  setPassword('Student@12345');
                  setError('');
                }}
              >
                <Text style={styles.demoPillText}>🎓 Aarav (MA-2026-001)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => {
                  setLoginId('MA-2026-002');
                  setPassword('Student@12345');
                  setError('');
                }}
              >
                <Text style={styles.demoPillText}>🎓 Kavita (MA-2026-002)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.whatsappHelpBtn} onPress={handleForgotStudentPass}>
          <Text style={styles.whatsappHelpText}>
            💬 Need login help? Contact Reception on WhatsApp
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          Student credentials are automatically generated during admission.
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
    backgroundColor: theme.colors.accentSlate,
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
    color: theme.colors.accentSlate,
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
    color: theme.colors.accentSlate,
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
    color: theme.colors.accentSlate,
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: theme.colors.accentSlate,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    textAlign: 'center',
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
  footerHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
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
});
