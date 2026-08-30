import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { teacherEndpoints } from '../../services/endpoints';
import { theme } from '../../theme';

export function TeacherAttendanceModal({ visible, batchId, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [batchData, setBatchData] = useState(null);
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAttendanceRoster = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await teacherEndpoints.getBatchAttendanceToday(batchId);
      if (res.ok && res.data) {
        setBatchData(res.data);
        setRecords(
          res.data.records.map((r) => ({
            student_id: r.student_id,
            student_name: r.student_name,
            student_login_id: r.student_login_id,
            status: r.status || 'present',
          }))
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to load batch attendance roster.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (visible && batchId) {
      loadAttendanceRoster();
    }
  }, [visible, batchId, loadAttendanceRoster]);

  const updateStudentStatus = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const markAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const submitRecords = records.map((r) => ({
        student_id: r.student_id,
        status: r.status,
      }));
      const res = await teacherEndpoints.markBatchAttendance(batchId, submitRecords);
      if (res.ok) {
        setMessage('Attendance saved successfully!');
        if (onSaved) onSaved();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const leaveCount = records.filter((r) => r.status === 'leave').length;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerBadge}>DAILY ATTENDANCE ROSTER</Text>
              <Text style={styles.modalTitle}>{batchData?.batch_name || 'Class Batch'}</Text>
              <Text style={styles.modalSub}>{batchData?.course_name}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading enrolled students roster...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalBody}>
              {/* Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statCol}>
                  <Text style={styles.statNum}>{records.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statNum, { color: theme.colors.success }]}>
                    {presentCount}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statNum, { color: theme.colors.danger }]}>
                    {absentCount}
                  </Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statNum, { color: theme.colors.warning }]}>
                    {leaveCount}
                  </Text>
                  <Text style={styles.statLabel}>Leave</Text>
                </View>
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.quickBar}>
                <TouchableOpacity
                  style={styles.quickPresetBtn}
                  onPress={() => markAll('present')}
                >
                  <Text style={styles.quickPresetText}>✓ Mark All Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickPresetBtn, { borderColor: theme.colors.dangerLight }]}
                  onPress={() => markAll('absent')}
                >
                  <Text style={[styles.quickPresetText, { color: theme.colors.danger }]}>
                    ✗ Mark All Absent
                  </Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {message ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{message}</Text>
                </View>
              ) : null}

              {/* Students List */}
              <View style={styles.rosterList}>
                {records.map((r, idx) => (
                  <View key={r.student_id} style={styles.rosterItem}>
                    <View style={styles.rosterLeft}>
                      <Text style={styles.rosterIndex}>{idx + 1}.</Text>
                      <View>
                        <Text style={styles.rosterName}>{r.student_name}</Text>
                        <Text style={styles.rosterId}>ID: {r.student_login_id || 'N/A'}</Text>
                      </View>
                    </View>

                    {/* 3 State Toggle */}
                    <View style={styles.toggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          r.status === 'present' && styles.toggleBtnPresent,
                        ]}
                        onPress={() => updateStudentStatus(r.student_id, 'present')}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            r.status === 'present' && styles.toggleTextActive,
                          ]}
                        >
                          P
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          r.status === 'absent' && styles.toggleBtnAbsent,
                        ]}
                        onPress={() => updateStudentStatus(r.student_id, 'absent')}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            r.status === 'absent' && styles.toggleTextActive,
                          ]}
                        >
                          A
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.toggleBtn, r.status === 'leave' && styles.toggleBtnLeave]}
                        onPress={() => updateStudentStatus(r.student_id, 'leave')}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            r.status === 'leave' && styles.toggleTextActive,
                          ]}
                        >
                          L
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.saveBtnText}>💾 Save Attendance to Database</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  modalBody: {
    padding: 18,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  quickBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickPresetBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  quickPresetText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    padding: 10,
    borderRadius: theme.radius.xs,
    marginBottom: 12,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: theme.colors.successLight,
    padding: 10,
    borderRadius: theme.radius.xs,
    marginBottom: 12,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  rosterList: {
    gap: 8,
    marginBottom: 20,
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rosterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rosterIndex: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    width: 20,
  },
  rosterName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  rosterId: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnPresent: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  toggleBtnAbsent: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  toggleBtnLeave: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    marginBottom: 10,
    ...theme.shadows.glowPrimary,
  },
  saveBtnText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
});

