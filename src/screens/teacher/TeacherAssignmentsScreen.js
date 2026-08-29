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

export function TeacherAssignmentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Create Assignment Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState('100');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Submissions Roster Modal State
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionsData, setSubmissionsData] = useState(null);

  // Evaluate Modal State
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [evalStudent, setEvalStudent] = useState(null);
  const [evalMarks, setEvalMarks] = useState('');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [evalSuccess, setEvalSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [assignRes, batchRes] = await Promise.all([
        teacherEndpoints.getAssignments(),
        teacherEndpoints.getBatches(),
      ]);
      if (assignRes.ok && assignRes.data) {
        setAssignments(assignRes.data);
      }
      if (batchRes.ok && batchRes.data) {
        setBatches(batchRes.data);
        if (batchRes.data.length > 0 && !selectedBatchId) {
          setSelectedBatchId(batchRes.data[0].id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateAssignment = async () => {
    if (!selectedBatchId) {
      setCreateError('Please select a batch.');
      return;
    }
    if (!assignTitle.trim()) {
      setCreateError('Assignment title is required.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const res = await teacherEndpoints.createAssignment({
        batch_id: selectedBatchId,
        title: assignTitle.trim(),
        description: assignDesc.trim() || undefined,
        due_date: assignDueDate.trim() || undefined,
        max_marks: parseInt(assignMaxMarks, 10) || 100,
      });

      if (res.ok) {
        setCreateModalVisible(false);
        setAssignTitle('');
        setAssignDesc('');
        setAssignDueDate('');
        setAssignMaxMarks('100');
        loadData();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create assignment.');
    } finally {
      setCreating(false);
    }
  };

  const openSubmissionsRoster = async (assignment) => {
    setActiveAssignment(assignment);
    setRosterModalVisible(true);
    setRosterLoading(true);
    setSubmissionsData(null);

    try {
      const res = await teacherEndpoints.getAssignmentSubmissions(assignment.id);
      if (res.ok && res.data) {
        setSubmissionsData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load submissions', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const openEvaluationModal = (studentItem) => {
    setEvalStudent(studentItem);
    setEvalMarks(studentItem.marks !== null && studentItem.marks !== undefined ? String(studentItem.marks) : '');
    setEvalFeedback(studentItem.feedback || '');
    setEvalError('');
    setEvalModalVisible(true);
  };

  const handleQuickApprove = async (studentItem) => {
    try {
      const defaultMarks = activeAssignment?.max_marks || 100;
      await teacherEndpoints.evaluateSubmission(activeAssignment.id, {
        student_id: studentItem.student_id,
        marks: defaultMarks,
        feedback: 'Practical assignment approved & marked completed by faculty.',
      });
      const updatedRes = await teacherEndpoints.getAssignmentSubmissions(activeAssignment.id);
      if (updatedRes.ok && updatedRes.data) {
        setSubmissionsData(updatedRes.data);
      }
      loadData();
    } catch (err) {
      alert(`Could not mark completed: ${err.message}`);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!evalMarks.trim() || isNaN(evalMarks)) {
      setEvalError('Please enter a valid numeric mark.');
      return;
    }

    setEvaluating(true);
    setEvalError('');
    setEvalSuccess('');

    try {
      const res = await teacherEndpoints.evaluateSubmission(activeAssignment.id, {
        student_id: evalStudent.student_id,
        marks: parseFloat(evalMarks),
        feedback: evalFeedback.trim() || undefined,
      });

      if (res.ok) {
        setEvalSuccess('Marks & evaluation feedback saved!');
        // Refresh active submissions roster
        const updatedRes = await teacherEndpoints.getAssignmentSubmissions(activeAssignment.id);
        if (updatedRes.ok && updatedRes.data) {
          setSubmissionsData(updatedRes.data);
        }
        loadData();
        setTimeout(() => {
          setEvalModalVisible(false);
          setEvalSuccess('');
        }, 1000);
      }
    } catch (err) {
      setEvalError(err.message || 'Failed to save evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  const totalAssignmentsCount = assignments.length;
  const totalSubmissionsCount = assignments.reduce((acc, a) => acc + (a.submitted_count || 0), 0);
  const totalPendingCount = assignments.reduce((acc, a) => acc + (a.pending_count || 0), 0);
  const totalEvaluatedCount = assignments.reduce((acc, a) => acc + (a.evaluated_count || 0), 0);

  const filteredAssignments = assignments.filter((a) => {
    const q = search.toLowerCase().trim();
    return (
      a.title.toLowerCase().includes(q) ||
      a.batch_name.toLowerCase().includes(q) ||
      a.course_name.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading batch assignments & submissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Header & Actions */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Batch Assignments</Text>
            <Text style={styles.headerSub}>
              Create practical assignments & track student submission status
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.createBtnText}>➕ New Assignment</Text>
          </TouchableOpacity>
        </View>

        {/* 2. KPI Summary Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{totalAssignmentsCount}</Text>
            <Text style={styles.statLabel}>Total Created</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.success }]}>
              {totalSubmissionsCount}
            </Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.warning }]}>
              {totalPendingCount}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.accentSlate }]}>
              {totalEvaluatedCount}
            </Text>
            <Text style={styles.statLabel}>Evaluated</Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search assignments by title, batch, or course..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* 3. Assignments List */}
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

        {filteredAssignments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Assignments Created Yet</Text>
            <Text style={styles.emptySub}>
              Tap the "+ New Assignment" button above to give your batch practical coursework.
            </Text>
          </View>
        ) : (
          <View style={styles.assignList}>
            {filteredAssignments.map((a) => (
              <View key={a.id} style={styles.assignCard}>
                <View style={styles.assignCardHeader}>
                  <View style={styles.batchTag}>
                    <Text style={styles.batchTagText}>{a.batch_name}</Text>
                  </View>
                  <Text style={styles.dueText}>
                    📅 Due: {a.due_date || 'No deadline'} • Max {a.max_marks} Marks
                  </Text>
                </View>

                <Text style={styles.assignTitle}>{a.title}</Text>
                <Text style={styles.courseName}>{a.course_name}</Text>
                {a.description ? (
                  <Text style={styles.assignDesc} numberOfLines={2}>
                    {a.description}
                  </Text>
                ) : null}

                {/* Submission Progress Status */}
                <View style={styles.progressBox}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Student Submissions:</Text>
                    <Text style={styles.progressValue}>
                      <Text style={{ color: theme.colors.success, fontWeight: '800' }}>
                        {a.submitted_count} Submitted
                      </Text>{' '}
                      / {a.total_students} Enrolled
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${
                            a.total_students > 0
                              ? Math.min(100, (a.submitted_count / a.total_students) * 100)
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Actions */}
                <TouchableOpacity
                  style={styles.checkRosterBtn}
                  onPress={() => openSubmissionsRoster(a)}
                >
                  <Text style={styles.checkRosterBtnText}>
                    🔍 Check Student Submissions & Grade ({a.submitted_count}/{a.total_students}) ➔
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Create New Assignment</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Batch Select */}
              <Text style={styles.inputLabel}>Target Batch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.batchPillScroll}>
                {batches.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.batchPill,
                      selectedBatchId === b.id && styles.batchPillActive,
                    ]}
                    onPress={() => setSelectedBatchId(b.id)}
                  >
                    <Text
                      style={[
                        styles.batchPillText,
                        selectedBatchId === b.id && styles.batchPillTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Assignment Title</Text>
              <TextInput
                style={styles.modalInput}
                value={assignTitle}
                onChangeText={setAssignTitle}
                placeholder="e.g. Maya 3D: Character Turntable & Arnold Render"
                placeholderTextColor={theme.colors.textMuted}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Submission Deadline</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={assignDueDate}
                    onChangeText={setAssignDueDate}
                    placeholder="e.g. 2026-08-30"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                <View style={{ width: 100 }}>
                  <Text style={styles.inputLabel}>Max Marks</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={assignMaxMarks}
                    onChangeText={setAssignMaxMarks}
                    placeholder="100"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Instructions / Task Details</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={assignDesc}
                onChangeText={setAssignDesc}
                placeholder="Enter assignment brief, required file formats, polygon limits, and guidelines..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
              />

              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreateAssignment}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.saveBtnText}>Publish Assignment to Batch</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STUDENT SUBMISSIONS ROSTER MODAL */}
      <Modal visible={rosterModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerBadge}>STUDENT SUBMISSION TRACKER</Text>
                <Text style={styles.modalTitle}>{activeAssignment?.title}</Text>
                <Text style={styles.modalSub}>
                  Batch: {activeAssignment?.batch_name} • Max Marks: {activeAssignment?.max_marks}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRosterModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {rosterLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading student submission records...</Text>
                </View>
              ) : (
                <>
                  {/* Summary Bar */}
                  <View style={styles.statsBar}>
                    <View style={styles.statCol}>
                      <Text style={styles.statNum}>{submissionsData?.total_students || 0}</Text>
                      <Text style={styles.statLabel}>Enrolled</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={[styles.statNum, { color: theme.colors.success }]}>
                        {submissionsData?.submitted_count || 0}
                      </Text>
                      <Text style={styles.statLabel}>Done</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={[styles.statNum, { color: theme.colors.warning }]}>
                        {submissionsData?.pending_count || 0}
                      </Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={[styles.statNum, { color: theme.colors.accentSlate }]}>
                        {submissionsData?.evaluated_count || 0}
                      </Text>
                      <Text style={styles.statLabel}>Graded</Text>
                    </View>
                  </View>

                  {/* Student List */}
                  <View style={styles.rosterList}>
                    {submissionsData?.submissions?.map((s, idx) => (
                      <View key={s.student_id} style={styles.rosterCard}>
                        <View style={styles.rosterHeader}>
                          <View style={styles.rosterLeft}>
                            <Text style={styles.rosterIdx}>{idx + 1}.</Text>
                            <View>
                              <Text style={styles.studentNameText}>{s.student_name}</Text>
                              <Text style={styles.studentLoginIdText}>
                                ID: {s.student_login_id || 'N/A'}
                              </Text>
                            </View>
                          </View>

                          {/* Submission Status Badge */}
                          <View
                            style={[
                              styles.subBadge,
                              s.status === 'evaluated'
                                ? styles.subBadgeEvaluated
                                : s.status === 'submitted'
                                ? styles.subBadgeSubmitted
                                : styles.subBadgePending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.subBadgeText,
                                s.status === 'evaluated'
                                  ? styles.subBadgeTextEvaluated
                                  : s.status === 'submitted'
                                  ? styles.subBadgeTextSubmitted
                                  : styles.subBadgeTextPending,
                              ]}
                            >
                              {s.status === 'evaluated'
                                ? `⭐ Graded: ${s.marks}/${activeAssignment?.max_marks}`
                                : s.status === 'submitted'
                                ? '✓ Submitted'
                                : '⏳ Pending'}
                            </Text>
                          </View>
                        </View>

                        {/* Submission Content or Status */}
                        {s.status !== 'pending' ? (
                          <View style={styles.submissionBody}>
                            <Text style={styles.subContentText}>
                              📝 {s.content || 'Submission uploaded'}
                            </Text>
                            {s.file_url ? (
                              <Text style={styles.fileLinkText}>🔗 Link: {s.file_url}</Text>
                            ) : null}
                            {s.feedback ? (
                              <Text style={styles.feedbackText}>
                                💬 Mentor Feedback: {s.feedback}
                              </Text>
                            ) : null}
                          </View>
                        ) : (
                          <Text style={styles.pendingText}>
                            Student has not yet submitted this assignment.
                          </Text>
                        )}

                        {/* Action Buttons Row */}
                        <View style={styles.rosterBtnRow}>
                          <TouchableOpacity
                            style={[
                              styles.markDoneBtn,
                              s.status === 'evaluated' && styles.markDoneBtnActive,
                            ]}
                            onPress={() => handleQuickApprove(s)}
                          >
                            <Text style={styles.markDoneBtnText}>
                              {s.status === 'evaluated' ? '✓ Completed' : '✅ Mark Done'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.gradeBtn}
                            onPress={() => openEvaluationModal(s)}
                          >
                            <Text style={styles.gradeBtnText}>
                              {s.status === 'evaluated' ? '✏️ Marks & Notes' : '⭐ Grade & Feedback'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EVALUATE / GRADE MODAL */}
      <Modal visible={evalModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardSmall}>
            <Text style={styles.modalTitle}>⭐ Grade Student Assignment</Text>
            <Text style={styles.modalSub}>
              Student: {evalStudent?.student_name} ({evalStudent?.student_login_id})
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                Marks Awarded (Out of {activeAssignment?.max_marks || 100})
              </Text>
              <TextInput
                style={styles.modalInput}
                value={evalMarks}
                onChangeText={setEvalMarks}
                placeholder="e.g. 92"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Mentor Feedback & Remarks</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={evalFeedback}
                onChangeText={setEvalFeedback}
                placeholder="e.g. Excellent lighting setup and topology. Clean wireframe rendering."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {evalError ? <Text style={styles.errorText}>{evalError}</Text> : null}
            {evalSuccess ? <Text style={styles.successText}>{evalSuccess}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEvalModalVisible(false)}
                disabled={evaluating}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtnModal, evaluating && { opacity: 0.6 }]}
                onPress={handleSaveEvaluation}
                disabled={evaluating}
              >
                {evaluating ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.saveBtnModalText}>Save Evaluation</Text>
                )}
              </TouchableOpacity>
            </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
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
  },
  createBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  createBtnText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
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
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
    textAlign: 'center',
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
  assignList: {
    gap: 14,
  },
  assignCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  assignCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  batchTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  batchTagText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  dueText: {
    color: theme.colors.accentSlate,
    fontSize: 11,
    fontWeight: '600',
  },
  assignTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  courseName: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  assignDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  progressBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xs,
    padding: 10,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  progressValue: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  checkRosterBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  checkRosterBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
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
  modalCardLarge: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
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
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 9,
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
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 18,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  batchPillScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  batchPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  batchPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  batchPillText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  batchPillTextActive: {
    color: theme.colors.primary,
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    marginTop: 18,
    ...theme.shadows.glowPrimary,
  },
  saveBtnText: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '800',
  },
  rosterList: {
    gap: 10,
    marginBottom: 16,
  },
  rosterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rosterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rosterIdx: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    width: 20,
  },
  studentNameText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  studentLoginIdText: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  subBadgeSubmitted: {
    backgroundColor: theme.colors.successLight,
  },
  subBadgePending: {
    backgroundColor: theme.colors.dangerLight,
  },
  subBadgeEvaluated: {
    backgroundColor: theme.colors.primaryLight,
  },
  subBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subBadgeTextSubmitted: {
    color: theme.colors.success,
  },
  subBadgeTextPending: {
    color: theme.colors.danger,
  },
  subBadgeTextEvaluated: {
    color: theme.colors.primary,
  },
  submissionBody: {
    backgroundColor: theme.colors.surfaceCard,
    padding: 8,
    borderRadius: theme.radius.xs,
    marginBottom: 10,
    gap: 4,
  },
  subContentText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  fileLinkText: {
    color: theme.colors.accentSlate,
    fontSize: 10,
  },
  feedbackText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  pendingText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  rosterBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  markDoneBtn: {
    flex: 1,
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  markDoneBtnActive: {
    backgroundColor: '#047857',
    borderColor: '#10B981',
  },
  markDoneBtnText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '800',
  },
  gradeBtn: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  gradeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtnModal: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveBtnModalText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  successText: {
    color: theme.colors.success,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
});

