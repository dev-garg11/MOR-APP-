import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createStudent, createStudentCredentials, updateLead } from '../../services/endpoints';
import { theme } from '../../theme';

export function AdmitStudentModal({ visible, lead, onClose, onSuccess }) {
  if (!lead) return null;

  const [course, setCourse] = useState(lead.course_interest || '3D Animation');
  const [batch, setBatch] = useState('Morning Batch (10:00 AM - 1:00 PM)');
  const [mode, setMode] = useState('offline');
  const [feesTotal, setFeesTotal] = useState('45000');
  const [feesPaid, setFeesPaid] = useState('15000');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [password, setPassword] = useState('Morph@2026');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);

  const handleAdmit = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Student record
      const studentPayload = {
        lead_id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || undefined,
        course: course,
        batch: batch,
        mode: mode,
        fees_total: parseFloat(feesTotal) || 0,
        fees_paid: parseFloat(feesPaid) || 0,
        discount_amount: parseFloat(discountAmount) || 0,
      };

      const studentRes = await createStudent(studentPayload);
      const studentData = studentRes.data;

      // 2. Generate Student Portal Credentials
      let loginId = `STU-${String(studentData.id).padStart(5, '0')}`;
      try {
        const credRes = await createStudentCredentials(studentData.id, {
          login_id: loginId,
          password: password,
        });
        if (credRes.data?.login_id) {
          loginId = credRes.data.login_id;
        }
      } catch (credErr) {
        console.warn('Credential creation error:', credErr);
      }

      // 3. Mark lead as 'enrolled'
      try {
        await updateLead(lead.id, {
          status: 'enrolled',
          notes: `Enrolled as student ID: ${loginId}. Batch: ${batch}`,
        });
      } catch (leadErr) {
        console.warn('Lead status update error:', leadErr);
      }

      setCreatedResult({
        student: studentData,
        loginId: loginId,
        password: password,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to complete admission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCredentialsWhatsApp = () => {
    if (!createdResult) return;
    const msg = `🎉 *Welcome to Morph Academy!*\n\nHi ${lead.name},\nYour admission for *${course}* is confirmed!\n\n📱 *Student Portal Access*:\n• *Login ID:* ${createdResult.loginId}\n• *Password:* ${createdResult.password}\n• *Batch:* ${batch}\n\nYou can now log in to the Morph Student App to view your attendance and fee receipts.`;
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {createdResult ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Admission Confirmed!</Text>
              <Text style={styles.successDesc}>
                {lead.name} has been enrolled successfully into {course}.
              </Text>

              <View style={styles.credCard}>
                <Text style={styles.credLabel}>STUDENT LOGIN CREDENTIALS</Text>
                <View style={styles.credRow}>
                  <Text style={styles.credKey}>Student ID:</Text>
                  <Text style={styles.credVal}>{createdResult.loginId}</Text>
                </View>
                <View style={styles.credRow}>
                  <Text style={styles.credKey}>Password:</Text>
                  <Text style={styles.credVal}>{createdResult.password}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={handleSendCredentialsWhatsApp}
              >
                <Text style={styles.whatsAppBtnText}>💬 Send Credentials on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeDoneBtn}
                onPress={() => {
                  setCreatedResult(null);
                  onClose();
                }}
              >
                <Text style={styles.closeDoneBtnText}>Done / Return to CRM</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.badge}>STUDENT ADMISSION</Text>
                  <Text style={styles.title}>Admit {lead.name}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
                  <Text style={styles.closeIconText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.leadSummary}>
                📞 {lead.phone} {lead.email ? `• ✉️ ${lead.email}` : ''}
              </Text>

              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Course Enrolled</Text>
                <TextInput
                  style={styles.input}
                  value={course}
                  onChangeText={setCourse}
                  placeholder="e.g. 3D Animation & VFX"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Batch Timing</Text>
                <TextInput
                  style={styles.input}
                  value={batch}
                  onChangeText={setBatch}
                  placeholder="e.g. Morning 10 AM / Weekend Pro"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Learning Mode</Text>
                <View style={styles.modeRow}>
                  {['offline', 'online', 'hybrid'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                      onPress={() => setMode(m)}
                    >
                      <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                        {m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.rowTwo}>
                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Total Course Fee (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={feesTotal}
                      onChangeText={setFeesTotal}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Initial Paid (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={feesPaid}
                      onChangeText={setFeesPaid}
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Default Student App Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password for student portal"
                  placeholderTextColor={theme.colors.textMuted}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.btnDisabled]}
                  onPress={handleAdmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textDark} />
                  ) : (
                    <Text style={styles.submitBtnText}>Confirm Admission & Issue ID ➔</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  leadSummary: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 18,
  },
  closeIconBtn: {
    padding: 6,
  },
  closeIconText: {
    color: theme.colors.textMuted,
    fontSize: 20,
  },
  formSection: {
    gap: 12,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: -4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: theme.colors.accentCyanLight,
    borderColor: theme.colors.accentCyan,
  },
  modeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: theme.colors.accentCyan,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
    gap: 6,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...theme.shadows.glowPrimary,
  },
  submitBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  successDesc: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  credCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 16,
  },
  credLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  credKey: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  credVal: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  whatsAppBtn: {
    width: '100%',
    backgroundColor: '#25D366',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  closeDoneBtn: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeDoneBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
});

