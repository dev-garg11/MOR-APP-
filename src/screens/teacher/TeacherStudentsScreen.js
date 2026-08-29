import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { teacherEndpoints } from '../../services/endpoints';
import { theme } from '../../theme';

export function TeacherStudentsScreen({ initialStudentId }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = useCallback(async () => {
    try {
      setError('');
      const [stuRes, batchRes] = await Promise.all([
        teacherEndpoints.getStudents({ batch: selectedBatch !== 'all' ? selectedBatch : undefined }),
        teacherEndpoints.getBatches(),
      ]);
      if (stuRes.ok && stuRes.data) {
        setStudents(stuRes.data);
        if (initialStudentId) {
          const match = stuRes.data.find((s) => s.id === initialStudentId);
          if (match) openStudentDetail(match);
        }
      }
      if (batchRes.ok && batchRes.data) {
        setBatches(batchRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBatch, initialStudentId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const openStudentDetail = async (student) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    setStudentDetail(null);
    try {
      const res = await teacherEndpoints.getStudentDetail(student.id);
      if (res.ok && res.data) {
        setStudentDetail(res.data);
      }
    } catch (err) {
      console.warn('Failed to load student detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.login_id && s.login_id.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      (s.batch && s.batch.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assigned students directory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header, Search & Filter */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Batch Students</Text>
        <Text style={styles.headerSub}>
          Students enrolled in your assigned cohorts ({students.length} Total Enrolled)
        </Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search by student name, login ID, or batch..."
          placeholderTextColor={theme.colors.textMuted}
        />

        {/* Batch Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedBatch === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedBatch('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedBatch === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Batches
            </Text>
          </TouchableOpacity>

          {batches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.filterPill, selectedBatch === b.name && styles.filterPillActive]}
              onPress={() => setSelectedBatch(b.name)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedBatch === b.name && styles.filterPillTextActive,
                ]}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Students List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {filteredStudents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySub}>
              {search
                ? 'No students matched your search criteria.'
                : 'No students are currently registered under this batch.'}
            </Text>
          </View>
        ) : (
          <View style={styles.studentGrid}>
            {filteredStudents.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.studentCard}
                onPress={() => openStudentDetail(s)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{s.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.attBadge}>
                    <Text style={styles.attBadgeText}>Att: {s.attendance_percentage}</Text>
                  </View>
                </View>

                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentIdText}>ID: {s.login_id || `STU-${s.id}`}</Text>

                <View style={styles.cardDivider} />

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Batch:</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {s.batch || 'Unassigned'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Course:</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {s.course}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.viewProfileText}>Academic Profile ➔</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* STUDENT ACADEMIC PROFILE MODAL */}
      <Modal visible={Boolean(selectedStudent)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
                <Text style={styles.modalSub}>
                  ID: {selectedStudent?.login_id || `STU-${selectedStudent?.id}`} •{' '}
                  {selectedStudent?.batch}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedStudent(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {detailLoading ? (
                <View style={styles.modalCenterBox}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading academic records & attendance...</Text>
                </View>
              ) : (
                <>
                  {/* Basic Info */}
                  <View style={styles.profileSummaryCard}>
                    <View style={styles.profileSummaryRow}>
                      <Text style={styles.profileSummaryLabel}>Course Specialization:</Text>
                      <Text style={styles.profileSummaryValue}>{studentDetail?.course}</Text>
                    </View>
                    <View style={styles.profileSummaryRow}>
                      <Text style={styles.profileSummaryLabel}>Assigned Cohort / Batch:</Text>
                      <Text style={[styles.profileSummaryValue, { color: theme.colors.primary }]}>
                        {studentDetail?.batch}
                      </Text>
                    </View>
                    <View style={styles.profileSummaryRow}>
                      <Text style={styles.profileSummaryLabel}>Academic Status:</Text>
                      <Text style={[styles.profileSummaryValue, { color: theme.colors.success }]}>
                        🟢 {studentDetail?.status?.toUpperCase() || 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  {/* Attendance Performance Metric */}
                  <Text style={styles.modalSectionTitle}>📊 Attendance Record</Text>
                  <View style={styles.attMetricCard}>
                    <View style={styles.attMetricCol}>
                      <Text style={styles.attMetricBig}>{studentDetail?.attendance_percentage}</Text>
                      <Text style={styles.attMetricSub}>Attendance Rate</Text>
                    </View>
                    <View style={styles.attMetricDivider} />
                    <View style={styles.attMetricCol}>
                      <Text style={[styles.attMetricBig, { color: theme.colors.textPrimary }]}>
                        {studentDetail?.attended_classes} / {studentDetail?.total_classes}
                      </Text>
                      <Text style={styles.attMetricSub}>Sessions Attended</Text>
                    </View>
                  </View>

                  {/* Recent Attendance History */}
                  <Text style={styles.modalSectionTitle}>📅 Recent Class Logs</Text>
                  {studentDetail?.attendance_records?.length === 0 ? (
                    <Text style={styles.noLogsText}>No attendance records logged yet.</Text>
                  ) : (
                    <View style={styles.attLogsList}>
                      {studentDetail?.attendance_records?.map((rec) => (
                        <View key={rec.id} style={styles.attLogItem}>
                          <Text style={styles.attLogDate}>{rec.date}</Text>
                          <View
                            style={[
                              styles.attLogStatusBadge,
                              rec.status === 'present'
                                ? styles.attLogStatusPresent
                                : styles.attLogStatusAbsent,
                            ]}
                          >
                            <Text
                              style={[
                                styles.attLogStatusText,
                                rec.status === 'present'
                                  ? styles.attLogStatusTextPresent
                                  : styles.attLogStatusTextAbsent,
                              ]}
                            >
                              {rec.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Academic Progress & Remarks */}
                  <Text style={styles.modalSectionTitle}>📈 Academic Progress & Milestones</Text>
                  <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>
                      {studentDetail?.academic_progress?.current_module || 'Current Module Active'}
                    </Text>
                    <Text style={styles.progressSub}>
                      {studentDetail?.academic_progress?.remarks ||
                        'Student is actively participating in lab practicals.'}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
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
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceCard,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    padding: 12,
    borderRadius: theme.radius.sm,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  emptyBox: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  studentCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  attBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  attBadgeText: {
    color: theme.colors.accentSlate,
    fontSize: 10,
    fontWeight: '800',
  },
  studentName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  studentIdText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  metaLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  metaValue: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  viewProfileText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '90%',
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
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 18,
  },
  modalCenterBox: {
    padding: 30,
    alignItems: 'center',
  },
  profileSummaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
    marginBottom: 16,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileSummaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  profileSummaryValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalSectionTitle: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  attMetricCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  attMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  attMetricDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  attMetricBig: {
    color: theme.colors.success,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  attMetricSub: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  attLogsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
    marginBottom: 16,
  },
  attLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  attLogDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  attLogStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  attLogStatusPresent: {
    backgroundColor: theme.colors.successLight,
  },
  attLogStatusAbsent: {
    backgroundColor: theme.colors.dangerLight,
  },
  attLogStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  attLogStatusTextPresent: {
    color: theme.colors.success,
  },
  attLogStatusTextAbsent: {
    color: theme.colors.danger,
  },
  noLogsText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  progressTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});

