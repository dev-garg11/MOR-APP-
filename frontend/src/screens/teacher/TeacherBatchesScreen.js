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

export function TeacherBatchesScreen({ initialBatchId, onOpenAttendance, onOpenStudent, onOpenAssignments }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  // Batch Curriculum & Topic Progress Tracker Modal
  const [curriculumModalVisible, setCurriculumModalVisible] = useState(false);
  const [curriculumBatch, setCurriculumBatch] = useState(null);
  const [curriculumData, setCurriculumData] = useState(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      setError('');
      const res = await teacherEndpoints.getBatches();
      if (res.ok && res.data) {
        setBatches(res.data);
        if (initialBatchId) {
          const match = res.data.find((b) => b.id === initialBatchId);
          if (match) openBatchDetail(match);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load assigned batches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialBatchId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBatches();
  };

  const openBatchDetail = async (batch) => {
    setSelectedBatch(batch);
    setDetailLoading(true);
    setBatchDetail(null);
    try {
      const res = await teacherEndpoints.getBatchDetail(batch.id);
      if (res.ok && res.data) {
        setBatchDetail(res.data);
      }
    } catch (err) {
      console.warn('Failed to load batch detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCurriculumModal = async (batch) => {
    setCurriculumBatch(batch);
    setCurriculumModalVisible(true);
    setCurriculumLoading(true);
    setCurriculumData(null);
    try {
      const res = await teacherEndpoints.getBatchCurriculum(batch.id);
      if (res.ok && res.data) {
        setCurriculumData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load batch curriculum', err);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleToggleTopic = async (lessonId) => {
    if (!curriculumBatch) return;
    try {
      const res = await teacherEndpoints.toggleBatchLesson(curriculumBatch.id, lessonId);
      if (res.ok) {
        const updatedRes = await teacherEndpoints.getBatchCurriculum(curriculumBatch.id);
        if (updatedRes.ok && updatedRes.data) {
          setCurriculumData(updatedRes.data);
        }
      }
    } catch (err) {
      alert(`Could not update topic status: ${err.message}`);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const q = search.toLowerCase().trim();
    return (
      b.name.toLowerCase().includes(q) ||
      b.course_name.toLowerCase().includes(q) ||
      (b.timing && b.timing.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assigned batches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Assigned Batches</Text>
        <Text style={styles.headerSub}>
          Active teaching cohorts and schedules ({batches.length} Batches Assigned)
        </Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search batches by batch name or course..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Batches List */}
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

        {filteredBatches.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Batches Found</Text>
            <Text style={styles.emptySub}>
              {search
                ? 'No batches matched your search query.'
                : 'You are not assigned to any batches currently.'}
            </Text>
          </View>
        ) : (
          <View style={styles.batchList}>
            {filteredBatches.map((b) => (
              <View key={b.id} style={styles.batchCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>🟢 {b.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.studentCountBadge}>👥 {b.students_count} Students</Text>
                </View>

                <Text style={styles.batchName}>{b.name}</Text>
                <Text style={styles.batchCourse}>{b.course_name}</Text>

                <View style={styles.metaBox}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Timing</Text>
                    <Text style={styles.metaValue}>⏰ {b.timing || '10:00 AM - 12:00 PM'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Days</Text>
                    <Text style={styles.metaValue}>🗓 {b.days || 'Mon, Wed, Fri'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Schedule</Text>
                    <Text style={styles.metaValue}>
                      {b.start_date ? `${b.start_date} to ${b.end_date || 'Ongoing'}` : 'Active Session'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => openBatchDetail(b)}
                  >
                    <Text style={styles.primaryActionBtnText}>Batch Details ➔</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.syllabusActionBtn}
                    onPress={() => openCurriculumModal(b)}
                  >
                    <Text style={styles.syllabusActionBtnText}>📚 Syllabus</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.attActionBtn}
                    onPress={() => onOpenAttendance(b.id)}
                  >
                    <Text style={styles.attActionBtnText}>📅 Attendance</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* BATCH DETAIL MODAL */}
      <Modal visible={Boolean(selectedBatch)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedBatch?.name}</Text>
                <Text style={styles.modalSub}>{selectedBatch?.course_name}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedBatch(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {detailLoading ? (
                <View style={styles.modalCenterBox}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading batch details and roster...</Text>
                </View>
              ) : (
                <>
                  {/* Batch Summary Info */}
                  <View style={styles.detailSummaryCard}>
                    <View style={styles.detailSummaryRow}>
                      <Text style={styles.detailSummaryLabel}>Course Track:</Text>
                      <Text style={styles.detailSummaryValue}>{batchDetail?.course_name}</Text>
                    </View>
                    <View style={styles.detailSummaryRow}>
                      <Text style={styles.detailSummaryLabel}>Timing & Days:</Text>
                      <Text style={styles.detailSummaryValue}>
                        {batchDetail?.timing} ({batchDetail?.days})
                      </Text>
                    </View>
                    <View style={styles.detailSummaryRow}>
                      <Text style={styles.detailSummaryLabel}>Total Students:</Text>
                      <Text style={[styles.detailSummaryValue, { color: theme.colors.success }]}>
                        {batchDetail?.students_count} Enrolled
                      </Text>
                    </View>
                  </View>

                  {/* 4 Entry Points for Teacher Workflows */}
                  <Text style={styles.modalSectionTitle}>⚡ Quick Workflows & Integrations</Text>
                  <View style={styles.workflowGrid}>
                    <TouchableOpacity
                      style={styles.workflowBtn}
                      onPress={() => {
                        const bId = selectedBatch.id;
                        setSelectedBatch(null);
                        onOpenAttendance(bId);
                      }}
                    >
                      <Text style={styles.workflowIcon}>📅</Text>
                      <Text style={styles.workflowBtnTitle}>Mark Attendance</Text>
                      <Text style={styles.workflowBtnSub}>Record daily student roster</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.workflowBtn}
                      onPress={() => {
                        const cur = selectedBatch;
                        setSelectedBatch(null);
                        openCurriculumModal(cur);
                      }}
                    >
                      <Text style={styles.workflowIcon}>📚</Text>
                      <Text style={styles.workflowBtnTitle}>Topic Syllabus</Text>
                      <Text style={styles.workflowBtnSub}>Track & mark completed topics</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.workflowBtn}
                      onPress={() => {
                        setSelectedBatch(null);
                        if (onOpenAssignments) onOpenAssignments();
                      }}
                    >
                      <Text style={styles.workflowIcon}>📝</Text>
                      <Text style={styles.workflowBtnTitle}>Assignments</Text>
                      <Text style={styles.workflowBtnSub}>Create, check & grade tasks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.workflowBtn}
                      onPress={() => setPerfModalVisible(true)}
                    >
                      <Text style={styles.workflowIcon}>📈</Text>
                      <Text style={styles.workflowBtnTitle}>Performance</Text>
                      <Text style={styles.workflowBtnSub}>View student marks & feedback</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Enrolled Students List */}
                  <Text style={styles.modalSectionTitle}>
                    🎓 Enrolled Students ({batchDetail?.students?.length || 0})
                  </Text>

                  {batchDetail?.students?.length === 0 ? (
                    <Text style={styles.noStudentsText}>No students enrolled in this batch yet.</Text>
                  ) : (
                    <View style={styles.studentList}>
                      {batchDetail?.students?.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.studentItem}
                          onPress={() => {
                            setSelectedBatch(null);
                            onOpenStudent(s.id);
                          }}
                        >
                          <View style={styles.studentAvatar}>
                            <Text style={styles.studentAvatarText}>
                              {s.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentName}>{s.name}</Text>
                            <Text style={styles.studentLoginId}>ID: {s.login_id || 'N/A'}</Text>
                          </View>
                          <View style={styles.studentAttBadge}>
                            <Text style={styles.studentAttText}>
                              Att: {s.attendance_percentage}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BATCH CURRICULUM & TOPIC PROGRESS MODAL */}
      <Modal
        visible={curriculumModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurriculumModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📚 Syllabus & Topic Progress</Text>
                <Text style={styles.modalSub}>
                  {curriculumBatch?.name} • {curriculumData?.course_name || curriculumBatch?.course_name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setCurriculumModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {curriculumLoading ? (
                <View style={styles.modalCenterBox}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading course topics & syllabus...</Text>
                </View>
              ) : (
                <>
                  {/* Progress Header Card */}
                  <View style={styles.curriculumProgressCard}>
                    <View style={styles.curriculumProgressTop}>
                      <Text style={styles.curriculumProgressTitle}>Batch Syllabus Completion</Text>
                      <Text style={styles.curriculumProgressPct}>
                        {curriculumData?.completion_percentage || 0}%
                      </Text>
                    </View>
                    <Text style={styles.curriculumProgressSub}>
                      {curriculumData?.completed_topics || 0} of {curriculumData?.total_topics || 0} Topics Completed
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${curriculumData?.completion_percentage || 0}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <Text style={styles.curriculumHintText}>
                    💡 Click on any topic to mark it as DONE or UNMARK. Students in this batch will see live completion status on their portal!
                  </Text>

                  {/* Modules & Topics List */}
                  {curriculumData?.modules?.map((mod, mIdx) => (
                    <View key={mod.id} style={styles.moduleBox}>
                      <View style={styles.moduleHeader}>
                        <Text style={styles.moduleBadge}>MODULE {mIdx + 1}</Text>
                        <Text style={styles.moduleTitle}>{mod.title}</Text>
                        {mod.description ? (
                          <Text style={styles.moduleDesc}>{mod.description}</Text>
                        ) : null}
                      </View>

                      <View style={styles.topicsList}>
                        {mod.lessons?.map((lesson, lIdx) => (
                          <TouchableOpacity
                            key={lesson.id}
                            style={[
                              styles.topicRow,
                              lesson.is_completed && styles.topicRowCompleted,
                            ]}
                            onPress={() => handleToggleTopic(lesson.id)}
                          >
                            <View style={styles.topicLeft}>
                              <View
                                style={[
                                  styles.topicCheckbox,
                                  lesson.is_completed && styles.topicCheckboxChecked,
                                ]}
                              >
                                <Text style={styles.topicCheckIcon}>
                                  {lesson.is_completed ? '✓' : ''}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.topicTitle,
                                    lesson.is_completed && styles.topicTitleCompleted,
                                  ]}
                                >
                                  {mIdx + 1}.{lIdx + 1} {lesson.title}
                                </Text>
                                <Text style={styles.topicDuration}>⏱ {lesson.duration}</Text>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.topicStatusBadge,
                                lesson.is_completed
                                  ? styles.topicStatusBadgeDone
                                  : styles.topicStatusBadgePending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.topicStatusText,
                                  lesson.is_completed
                                    ? styles.topicStatusTextDone
                                    : styles.topicStatusTextPending,
                                ]}
                              >
                                {lesson.is_completed ? '✅ Done' : '⭕ Mark Done'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
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
  batchList: {
    gap: 14,
  },
  batchCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  statusBadgeText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  studentCountBadge: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  batchName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  batchCourse: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  metaBox: {
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: theme.radius.xs,
    gap: 6,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  metaValue: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  attActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  attActionBtnText: {
    color: theme.colors.accentSlate,
    fontSize: 12,
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
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  modalCardSmall: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  detailSummaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
    marginBottom: 16,
  },
  detailSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailSummaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  detailSummaryValue: {
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
  workflowGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  workflowBtn: {
    flex: 1,
    minWidth: 140,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
  },
  workflowIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  workflowBtnTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  workflowBtnSub: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  studentList: {
    gap: 8,
    marginBottom: 20,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 13,
  },
  studentName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  studentLoginId: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  studentAttBadge: {
    backgroundColor: theme.colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  studentAttText: {
    color: theme.colors.accentSlate,
    fontSize: 11,
    fontWeight: '700',
  },
  noStudentsText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 14,
  },
  integrationNotice: {
    backgroundColor: theme.colors.primaryLight,
    padding: 12,
    borderRadius: theme.radius.sm,
    marginVertical: 14,
  },
  integrationNoticeText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  modalPrimaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  syllabusActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syllabusActionBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
  },
  curriculumProgressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  curriculumProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  curriculumProgressTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  curriculumProgressPct: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  curriculumProgressSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  curriculumHintText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceCard,
    padding: 10,
    borderRadius: theme.radius.xs,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  moduleBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  moduleHeader: {
    padding: 12,
    backgroundColor: theme.colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  moduleBadge: {
    color: theme.colors.accentSlate,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  moduleTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  moduleDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  topicsList: {
    padding: 8,
    gap: 6,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    padding: 10,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  topicRowCompleted: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  topicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topicCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCheckboxChecked: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  topicCheckIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  topicTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  topicTitleCompleted: {
    color: theme.colors.success,
    fontWeight: '700',
  },
  topicDuration: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  topicStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  topicStatusBadgeDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  topicStatusBadgePending: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  topicStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topicStatusTextDone: {
    color: theme.colors.success,
  },
  topicStatusTextPending: {
    color: theme.colors.textMuted,
  },
});

