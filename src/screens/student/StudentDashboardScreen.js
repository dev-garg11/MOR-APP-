import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createRazorpayOrder,
  getMyAttendance,
  getMyFees,
  getMyProfile,
  getMyAssignments,
  getMyCurriculum,
  submitMyAssignment,
  logoutStudent,
} from '../../services/endpoints';
import { theme } from '../../theme';

export function StudentDashboardScreen({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  // Student Assignment Submission Modal
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const loadStudentData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, feesRes, attRes, assignRes, curRes] = await Promise.all([
        getMyProfile(),
        getMyFees(),
        getMyAttendance(),
        getMyAssignments().catch(() => ({ data: [] })),
        getMyCurriculum().catch(() => ({ data: null })),
      ]);

      setProfile(profileRes.data || {});
      setFees(feesRes.data || {});
      setAttendance(attRes.data || {});
      setAssignments(assignRes.data || []);
      setCurriculum(curRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load your student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const openSubmitModal = (assign) => {
    setSelectedAssignment(assign);
    setSubmitContent(assign.content || '');
    setSubmitFileUrl(assign.file_url || '');
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitModalVisible(true);
  };

  const handleSubmitWork = async () => {
    if (!selectedAssignment) return;
    if (!submitContent.trim() && !submitFileUrl.trim()) {
      setSubmitError('Please enter some submission notes or attach a project drive/github link.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const res = await submitMyAssignment(selectedAssignment.id, {
        content: submitContent.trim(),
        file_url: submitFileUrl.trim() || undefined,
      });

      setSubmitSuccess('✓ Assignment submitted successfully for faculty review!');
      const updatedAssign = await getMyAssignments();
      if (updatedAssign.data) {
        setAssignments(updatedAssign.data);
      }
      setTimeout(() => {
        setSubmitModalVisible(false);
        setSubmitSuccess('');
      }, 1200);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayOnline = async () => {
    if (!fees?.pending_amount || fees.pending_amount <= 0) {
      alert('You have no pending dues! Your fees are completely cleared.');
      return;
    }

    setPaying(true);
    try {
      // Amount in paise (e.g. ₹5000 = 500000 paise)
      const amountPaise = Math.round(Number(fees.pending_amount) * 100);
      const orderRes = await createRazorpayOrder(amountPaise);
      
      alert(
        `💳 Razorpay Checkout initialized!\nOrder ID: ${orderRes.data?.order_id || 'RZP-ORD-SUCCESS'}\nAmount: ₹${fees.pending_amount}\n\nRedirecting to secure payment window...`
      );
    } catch (err) {
      alert(`Payment order failed: ${err.message}`);
    } finally {
      setPaying(false);
    }
  };

  const handleLogout = async () => {
    await logoutStudent();
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.accentCyan} />
        <Text style={styles.loadingText}>Loading your student profile…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadStudentData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryBtn, { marginTop: 10 }]} onPress={handleLogout}>
          <Text style={styles.retryBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const attList = Array.isArray(attendance) ? attendance : (attendance?.records || []);
  const totalClasses = attList.length || (attendance?.summary?.total_classes || 0);
  const presentClasses = Array.isArray(attendance)
    ? attList.filter((r) => String(r.status).toLowerCase() === 'present').length
    : (attendance?.summary?.present || 0);
  const attPct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>STUDENT PORTAL</Text>
          <Text style={styles.headerTitle}>Welcome, {profile?.name} 👋</Text>
          <Text style={styles.headerSub}>
            Roll No: {profile?.login_id || `STU-#${profile?.id}`} • {profile?.course}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Two Metric Cards: Attendance & Fee Status */}
      <View style={styles.gridRow}>
        {/* Attendance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBadgeCyan}>ATTENDANCE METER</Text>
            <Text style={styles.cardIcon}>📊</Text>
          </View>
          <Text style={[styles.bigVal, { color: theme.colors.accentCyan }]}>{attPct}%</Text>
          <Text style={styles.cardSub}>
            {presentClasses} Present / {totalClasses} Total Sessions
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${attPct}%` }]} />
          </View>
        </View>

        {/* Fee Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardBadgeAmber}>FEE SUMMARY</Text>
            <Text style={styles.cardIcon}>💳</Text>
          </View>
          <Text
            style={[
              styles.bigVal,
              {
                color:
                  fees?.pending_amount > 0 ? theme.colors.danger : theme.colors.success,
              },
            ]}
          >
            ₹{Number(fees?.pending_amount || 0).toLocaleString()}
          </Text>
          <Text style={styles.cardSub}>
            {fees?.pending_amount > 0
              ? `Due Date: ${fees?.fee_due_date || 'Upcoming'}`
              : '✓ All Dues Cleared'}
          </Text>

          {fees?.pending_amount > 0 ? (
            <TouchableOpacity
              style={[styles.payNowBtn, paying && styles.btnDisabled]}
              onPress={handlePayOnline}
              disabled={paying}
            >
              <Text style={styles.payNowBtnText}>
                {paying ? 'Connecting to Gateway…' : '💳 Pay EMI Online'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>✓ Fees Fully Paid</Text>
            </View>
          )}
        </View>
      </View>

      {/* Class Schedule & Batch Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>My Batch & Timetable</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Program:</Text>
          <Text style={styles.infoValue}>{profile?.course || '3D Animation & VFX'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Batch Timing:</Text>
          <Text style={styles.infoValue}>{profile?.batch || 'Morning 10:00 AM - 1:00 PM'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mode:</Text>
          <Text style={styles.infoValue}>{profile?.mode?.toUpperCase() || 'OFFLINE STUDIO'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Lab:</Text>
          <Text style={styles.infoValue}>Lab #2 (High Performance 3D Workstations)</Text>
        </View>
      </View>

      {/* Payment History & Receipts */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>💳 Payment History & Receipts</Text>
        {fees?.payments?.length > 0 ? (
          fees.payments.map((p) => (
            <View key={p.id} style={styles.paymentRow}>
              <View>
                <Text style={styles.payAmount}>₹{Number(p.amount).toLocaleString()}</Text>
                <Text style={styles.payDate}>
                  📅 {p.payment_date} • Mode: {p.payment_mode || 'Online / UPI'}
                </Text>
                {p.notes ? <Text style={styles.payNotes}>{p.notes}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.receiptBtn}
                onPress={() =>
                  alert(
                    `📄 Morphy Academy Official Receipt #${p.id}\nStudent: ${profile?.name} (${profile?.login_id})\nAmount Paid: ₹${Number(p.amount).toLocaleString()}\nMode: ${p.payment_mode}\nDate: ${p.payment_date}\nStatus: Verified & Cleared`
                  )
                }
              >
                <Text style={styles.receiptBtnText}>📄 Download Receipt</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No previous payment records found.</Text>
        )}
      </View>

      {/* Course Curriculum & Topic Completion Tracker */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📚 Course Curriculum & Topic Progress</Text>
          <Text style={styles.progressPctBadge}>
            {curriculum?.completion_percentage || 0}% Complete
          </Text>
        </View>

        {curriculum ? (
          <>
            <View style={styles.curriculumSummary}>
              <Text style={styles.curriculumSummaryText}>
                {curriculum.completed_topics || 0} of {curriculum.total_topics || 0} Practical Topics Finished
              </Text>
              <View style={styles.curriculumProgressBarBg}>
                <View
                  style={[
                    styles.curriculumProgressBarFill,
                    { width: `${curriculum.completion_percentage || 0}%` },
                  ]}
                />
              </View>
            </View>

            {curriculum.modules?.map((mod, mIdx) => (
              <View key={mod.id} style={styles.moduleCard}>
                <View style={styles.moduleCardHeader}>
                  <Text style={styles.moduleCardBadge}>MODULE {mIdx + 1}</Text>
                  <Text style={styles.moduleCardTitle}>{mod.title}</Text>
                </View>
                <View style={styles.topicsGrid}>
                  {mod.lessons?.map((lesson, lIdx) => (
                    <View
                      key={lesson.id}
                      style={[
                        styles.topicItem,
                        lesson.is_completed && styles.topicItemCompleted,
                      ]}
                    >
                      <View style={styles.topicItemLeft}>
                        <Text style={styles.topicItemIcon}>
                          {lesson.is_completed ? '✅' : '⏳'}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.topicItemTitle,
                              lesson.is_completed && styles.topicItemTitleDone,
                            ]}
                          >
                            {lesson.title}
                          </Text>
                          <Text style={styles.topicItemSub}>Duration: {lesson.duration}</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.topicBadge,
                          lesson.is_completed ? styles.topicBadgeDone : styles.topicBadgePending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.topicBadgeText,
                            lesson.is_completed
                              ? styles.topicBadgeTextDone
                              : styles.topicBadgeTextPending,
                          ]}
                        >
                          {lesson.is_completed ? 'COMPLETED' : 'IN PROGRESS'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No curriculum topics loaded.</Text>
        )}
      </View>

      {/* Assignments & Practical Coursework */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📝 My Assignments & Tasks</Text>
          <Text style={styles.assignmentCountBadge}>{assignments.length} Tasks</Text>
        </View>

        {assignments.length > 0 ? (
          assignments.map((a) => (
            <View key={a.id} style={styles.assignmentCard}>
              <View style={styles.assignmentTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text style={styles.assignmentMeta}>
                    Due Date: 📅 {a.due_date} • Max Score: ⭐ {a.max_marks} Marks
                  </Text>
                </View>
                <View
                  style={[
                    styles.assignStatusBadge,
                    a.status === 'evaluated'
                      ? styles.assignStatusEvaluated
                      : a.status === 'submitted'
                      ? styles.assignStatusSubmitted
                      : styles.assignStatusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.assignStatusText,
                      a.status === 'evaluated'
                        ? styles.assignStatusTextEvaluated
                        : a.status === 'submitted'
                        ? styles.assignStatusTextSubmitted
                        : styles.assignStatusTextPending,
                    ]}
                  >
                    {a.status === 'evaluated'
                      ? `✅ DONE / EVALUATED`
                      : a.status === 'submitted'
                      ? '📤 SUBMITTED'
                      : '⏳ PENDING'}
                  </Text>
                </View>
              </View>

              {a.description ? (
                <Text style={styles.assignmentDesc}>{a.description}</Text>
              ) : null}

              {/* Evaluation Feedback or Submit Button */}
              {a.status === 'evaluated' ? (
                <View style={styles.evaluatedBox}>
                  <Text style={styles.evaluatedMarks}>
                    ⭐ Faculty Score: {a.marks} / {a.max_marks} Marks
                  </Text>
                  {a.feedback ? (
                    <Text style={styles.evaluatedFeedback}>
                      💬 Mentor Remarks: {a.feedback}
                    </Text>
                  ) : null}
                </View>
              ) : a.status === 'submitted' ? (
                <View style={styles.submittedInfoBox}>
                  <Text style={styles.submittedInfoText}>
                    ✓ Your project has been submitted on {a.submission_date?.split('T')[0] || 'Today'}. Faculty review is in progress.
                  </Text>
                  <TouchableOpacity
                    style={styles.resubmitBtn}
                    onPress={() => openSubmitModal(a)}
                  >
                    <Text style={styles.resubmitBtnText}>✏️ Update Submission</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pendingActionBox}>
                  <Text style={styles.pendingHintText}>
                    You have not submitted this practical task yet.
                  </Text>
                  <TouchableOpacity
                    style={styles.submitWorkBtn}
                    onPress={() => openSubmitModal(a)}
                  >
                    <Text style={styles.submitWorkBtnText}>📤 Submit Assignment ➔</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No assignments scheduled for your batch currently.</Text>
        )}
      </View>

      {/* SUBMISSION MODAL */}
      <Modal
        visible={submitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubmitModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Submit Assignment</Text>
                <Text style={styles.modalSub}>{selectedAssignment?.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSubmitModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {submitSuccess ? (
                <Text style={styles.modalSuccessText}>{submitSuccess}</Text>
              ) : null}
              {submitError ? (
                <Text style={styles.modalErrorText}>{submitError}</Text>
              ) : null}

              <Text style={styles.modalLabel}>Project Notes / Submission Details</Text>
              <TextInput
                style={styles.modalTextArea}
                value={submitContent}
                onChangeText={setSubmitContent}
                placeholder="Explain the practical steps done, software versions used, etc."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.modalLabel}>Project Drive / GitHub / ArtStation Link</Text>
              <TextInput
                style={styles.modalInput}
                value={submitFileUrl}
                onChangeText={setSubmitFileUrl}
                placeholder="https://drive.google.com/... or https://github.com/..."
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSubmitModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                  onPress={handleSubmitWork}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={theme.colors.textDark} />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>✓ Confirm Submission</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerBadge: {
    color: theme.colors.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  logoutBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    minWidth: 260,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardBadgeCyan: {
    color: theme.colors.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardBadgeAmber: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardIcon: {
    fontSize: 16,
  },
  bigVal: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accentCyan,
    borderRadius: theme.radius.full,
  },
  payNowBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
    ...theme.shadows.glowPrimary,
  },
  payNowBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 12,
  },
  paidBadge: {
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  paidBadgeText: {
    color: theme.colors.success,
    fontWeight: '800',
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sectionCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  payAmount: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  payDate: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  receiptBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  receiptBtnText: {
    color: theme.colors.accentCyan,
    fontSize: 11,
    fontWeight: '700',
  },
  noDataText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: theme.colors.accentCyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  retryBtnText: {
    color: theme.colors.textDark,
    fontWeight: '700',
  },
  payNotes: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressPctBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    color: theme.colors.accentCyan,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    fontWeight: '800',
    fontSize: 12,
  },
  curriculumSummary: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  curriculumSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  curriculumProgressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: 3,
    overflow: 'hidden',
  },
  curriculumProgressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accentCyan,
    borderRadius: 3,
  },
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  moduleCardHeader: {
    backgroundColor: theme.colors.surfaceCard,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  moduleCardBadge: {
    color: theme.colors.accentCyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  moduleCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  topicsGrid: {
    padding: 8,
    gap: 6,
  },
  topicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    padding: 10,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  topicItemCompleted: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
  },
  topicItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topicItemIcon: {
    fontSize: 14,
  },
  topicItemTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  topicItemTitleDone: {
    color: theme.colors.success,
    fontWeight: '700',
  },
  topicItemSub: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  topicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  topicBadgeDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  topicBadgePending: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  topicBadgeTextDone: {
    color: theme.colors.success,
  },
  topicBadgeTextPending: {
    color: theme.colors.textMuted,
  },
  assignmentCountBadge: {
    color: theme.colors.accentSlate,
    fontSize: 12,
    fontWeight: '700',
  },
  assignmentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  assignmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  assignmentTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  assignmentMeta: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  assignStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  assignStatusEvaluated: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  assignStatusSubmitted: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  assignStatusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  assignStatusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  assignStatusTextEvaluated: {
    color: '#10B981',
  },
  assignStatusTextSubmitted: {
    color: '#60A5FA',
  },
  assignStatusTextPending: {
    color: '#F59E0B',
  },
  assignmentDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  evaluatedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 10,
    borderRadius: theme.radius.xs,
  },
  evaluatedMarks: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  evaluatedFeedback: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  submittedInfoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    padding: 10,
    borderRadius: theme.radius.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submittedInfoText: {
    color: '#93C5FD',
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  resubmitBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  resubmitBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  pendingActionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    padding: 10,
    borderRadius: theme.radius.xs,
  },
  pendingHintText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  submitWorkBtn: {
    backgroundColor: theme.colors.accentCyan,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
  },
  submitWorkBtnText: {
    color: theme.colors.textDark,
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  modalTextArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    padding: 10,
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accentCyan,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  modalSuccessText: {
    color: theme.colors.success,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: theme.radius.xs,
  },
  modalErrorText: {
    color: theme.colors.danger,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: theme.radius.xs,
  },
});

