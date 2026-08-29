import React from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

export function StudentDetailModal({ visible, student, onClose, onNavigate }) {
  if (!student) return null;

  const total = Number(student.fees_total || 0);
  const paid = Number(student.fees_paid || 0);
  const discount = Number(student.discount_amount || 0);
  const pending = total - paid;

  const handleCall = () => {
    Linking.openURL(`tel:${student.phone}`);
  };

  const handleWhatsApp = () => {
    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const p = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hi ${student.name}, this is from Morphy Academy administration regarding your course ${student.course}.`;
    Linking.openURL(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerBadge}>
                  {student.login_id || `STUDENT #${student.id}`}
                </Text>
                <Text style={styles.headerTitle}>{student.name}</Text>
                <Text style={styles.headerSub}>🎯 {student.course}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Action Contact Bar */}
            <View style={styles.contactBar}>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Text style={styles.callBtnText}>📞 Call {student.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}>
                <Text style={styles.waBtnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Academic & Batch Details Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ACADEMIC & BATCH INFO</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Student Roll No / ID:</Text>
                <Text style={[styles.infoVal, { color: theme.colors.primary, fontWeight: '800' }]}>
                  {student.login_id || `STU-${String(student.id).padStart(5, '0')}`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Phone Number:</Text>
                <Text style={styles.infoVal}>{student.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Email Address:</Text>
                <Text style={styles.infoVal}>{student.email || 'Not Provided'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Assigned Batch:</Text>
                <Text style={styles.infoVal}>{student.batch || 'Batch-2026-A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Learning Mode:</Text>
                <Text style={styles.infoVal}>{student.mode?.toUpperCase() || 'OFFLINE STUDIO'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Enrollment Date:</Text>
                <Text style={styles.infoVal}>
                  {student.enrollment_date || String(student.created_at || '').split('T')[0] || '2026-08-23'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Portal Login Status:</Text>
                <Text
                  style={[
                    styles.infoVal,
                    { color: student.password_hash ? theme.colors.success : theme.colors.warning },
                  ]}
                >
                  {student.password_hash ? '✓ Credentials Active' : '⚠ Pending Password Setup'}
                </Text>
              </View>
            </View>

            {/* Financial Ledger & Fees Summary */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>FEE & INSTALLMENT LEDGER</Text>
              <View style={styles.feeGrid}>
                <View style={styles.feeBox}>
                  <Text style={styles.feeLabel}>TOTAL COURSE FEE</Text>
                  <Text style={styles.feeValue}>₹{total.toLocaleString()}</Text>
                </View>
                <View style={styles.feeBox}>
                  <Text style={styles.feeLabel}>FEES PAID</Text>
                  <Text style={[styles.feeValue, { color: theme.colors.success }]}>
                    ₹{paid.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.feeBox}>
                  <Text style={styles.feeLabel}>PENDING DUE</Text>
                  <Text
                    style={[
                      styles.feeValue,
                      { color: pending > 0 ? theme.colors.danger : theme.colors.textMuted },
                    ]}
                  >
                    ₹{pending.toLocaleString()}
                  </Text>
                </View>
                {discount > 0 ? (
                  <View style={styles.feeBox}>
                    <Text style={styles.feeLabel}>SCHOLARSHIP / DISCOUNT</Text>
                    <Text style={[styles.feeValue, { color: theme.colors.primary }]}>
                      ₹{discount.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Navigation Actions */}
            <View style={styles.navRow}>
              {onNavigate ? (
                <>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => {
                      onClose();
                      onNavigate('fees');
                    }}
                  >
                    <Text style={styles.navBtnText}>💳 View Fee Ledger</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => {
                      onClose();
                      onNavigate('attendance');
                    }}
                  >
                    <Text style={styles.navBtnText}>📅 Attendance Sheet</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  headerSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 20,
  },
  contactBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  callBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  callBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  waBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  waBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    gap: 10,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  infoVal: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  feeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  feeBox: {
    flex: 1,
    minWidth: 110,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.xs,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feeLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  feeValue: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  navBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  navBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
});

