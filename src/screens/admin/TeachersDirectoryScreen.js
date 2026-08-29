import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { listTeachers, onboardTeacher, updateTeacherStatus } from '../../services/endpoints';
import { theme } from '../../theme';

export function TeachersDirectoryScreen() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Onboard Modal State
  const [onboardModalVisible, setOnboardModalVisible] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('Teacher@12345');
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [selectedBatchId, setSelectedBatchId] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState(null);
  const [onboardError, setOnboardError] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listTeachers();
      setTeachers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load teachers directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTeacherStatus = async (teacherId, newStatus) => {
    try {
      // Optimistically update UI
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherId ? { ...t, status: newStatus } : t))
      );
      await updateTeacherStatus(teacherId, newStatus);
    } catch (err) {
      alert(err.message || 'Failed to update teacher status.');
      fetchTeachers();
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenOnboard = () => {
    setTeacherName('');
    setTeacherEmail('');
    setTeacherPassword('Teacher@12345');
    setSelectedCourseId(1);
    setSelectedBatchId(1);
    setOnboardSuccess(null);
    setOnboardError('');
    setOnboardModalVisible(true);
  };

  const handleOnboardSubmit = async () => {
    if (!teacherName.trim() || !teacherEmail.trim()) {
      setOnboardError('Please enter Faculty Full Name and Email Address.');
      return;
    }

    setSubmitting(true);
    setOnboardError('');
    try {
      const payload = {
        name: teacherName.trim(),
        email: teacherEmail.trim().toLowerCase(),
        password: teacherPassword.trim() || 'Teacher@12345',
        course_id: selectedCourseId,
        batch_id: selectedBatchId,
      };

      const res = await onboardTeacher(payload);
      if (res.data?.teacher) {
        setOnboardSuccess(res.data.teacher);
        fetchTeachers();
      }
    } catch (err) {
      setOnboardError(err.message || 'Failed to onboard faculty member.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.assigned_courses || []).some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerBadge}>FACULTY & TRAINER MANAGEMENT</Text>
          <Text style={styles.headerTitle}>Faculty & Mentors Directory</Text>
          <Text style={styles.headerSubtitle}>
            Onboard new teachers, assign batches & courses, and monitor teaching activity.
          </Text>
        </View>
        <View style={styles.headerBtnRow}>
          <TouchableOpacity style={styles.onboardBtn} onPress={handleOpenOnboard}>
            <Text style={styles.onboardBtnText}>➕ Onboard New Faculty</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchTeachers}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by faculty name, email, or course..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Faculty List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading faculty directory...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTeachers}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTeachers.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🧑‍🏫</Text>
          <Text style={styles.emptyTitle}>No Faculty Members Found</Text>
          <Text style={styles.emptySubtitle}>
            Click Onboard New Faculty above to add your first trainer.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countText}>
            Showing {filteredTeachers.length} Active Faculty Members
          </Text>

          <View style={styles.cardsGrid}>
            {filteredTeachers.map((t) => (
              <View key={t.id} style={styles.teacherCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {t.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherName}>{t.name}</Text>
                    <Text style={styles.teacherEmail}>{t.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      (t.status === 'on_leave' || t.status === 'holiday')
                        ? styles.statusBadgeHoliday
                        : (t.status === 'absent' || t.status === 'offline')
                        ? styles.statusBadgeAbsent
                        : t.status === 'inactive'
                        ? styles.statusBadgeInactive
                        : styles.statusBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        (t.status === 'on_leave' || t.status === 'holiday') && { color: '#F59E0B' },
                        (t.status === 'absent' || t.status === 'offline') && { color: '#EF4444' },
                        t.status === 'inactive' && { color: '#94A3B8' },
                      ]}
                    >
                      {t.status === 'on_leave' || t.status === 'holiday'
                        ? '🏖️ ON HOLIDAY (OFFLINE)'
                        : t.status === 'absent' || t.status === 'offline'
                        ? '🔴 ABSENT (OFFLINE)'
                        : t.status === 'inactive'
                        ? '⚪ INACTIVE'
                        : '🟢 ONLINE / ACTIVE'}
                    </Text>
                  </View>
                </View>

                {/* Assigned Courses */}
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>ASSIGNED COURSES:</Text>
                  <View style={styles.pillsRow}>
                    {(t.assigned_courses || []).length > 0 ? (
                      t.assigned_courses.map((c, i) => (
                        <View key={i} style={styles.coursePill}>
                          <Text style={styles.coursePillText}>📚 {c}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noneText}>No courses assigned yet</Text>
                    )}
                  </View>
                </View>

                {/* Assigned Batches */}
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>ASSIGNED BATCHES:</Text>
                  <View style={styles.pillsRow}>
                    {(t.assigned_batches || []).length > 0 ? (
                      t.assigned_batches.map((b, i) => (
                        <View key={i} style={styles.batchPill}>
                          <Text style={styles.batchPillText}>👥 {b}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noneText}>No batches assigned yet</Text>
                    )}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.loginHintText}>
                    🔑 Login: {t.email}
                  </Text>

                  {/* Status Toggle Buttons */}
                  <View style={styles.statusActionRow}>
                    {t.status === 'active' ? (
                      <>
                        <TouchableOpacity
                          style={styles.holidayBtn}
                          onPress={() => handleToggleTeacherStatus(t.id, 'on_leave')}
                        >
                          <Text style={styles.holidayBtnText}>🏖️ Mark Holiday (Offline)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.absentBtn}
                          onPress={() => handleToggleTeacherStatus(t.id, 'absent')}
                        >
                          <Text style={styles.absentBtnText}>🔴 Absent</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.onlineBtn}
                        onPress={() => handleToggleTeacherStatus(t.id, 'active')}
                      >
                        <Text style={styles.onlineBtnText}>🟢 Mark Present / Online</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ONBOARD NEW TEACHER MODAL */}
      <Modal
        visible={onboardModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOnboardModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🧑‍🏫 Onboard New Faculty Member</Text>
                <Text style={styles.modalSub}>
                  Create faculty account and assign teaching batches
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setOnboardModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {onboardSuccess ? (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>🎉 Faculty Onboarded Successfully!</Text>
                  <Text style={styles.successSub}>
                    Account created and allocated in Morph database:
                  </Text>
                  <View style={styles.credBox}>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Trainer Name: </Text>
                      <Text style={styles.credVal}>{onboardSuccess.name}</Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Login Email: </Text>
                      <Text style={[styles.credVal, { color: '#F59E0B', fontWeight: '900' }]}>
                        {onboardSuccess.email}
                      </Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Password: </Text>
                      <Text style={[styles.credVal, { color: '#10B981', fontWeight: '900' }]}>
                        {onboardSuccess.default_password}
                      </Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Assigned Course: </Text>
                      <Text style={styles.credVal}>
                        {onboardSuccess.assigned_course || 'Maya 3D Character Track'}
                      </Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Assigned Batch: </Text>
                      <Text style={styles.credVal}>
                        {onboardSuccess.assigned_batch || 'Maya 3D — Batch A'}
                      </Text>
                    </Text>
                  </View>
                  <Text style={styles.onboardNote}>
                    Faculty can now immediately login on the Faculty Portal using their email and password.
                  </Text>
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => setOnboardModalVisible(false)}
                  >
                    <Text style={styles.doneBtnText}>✓ Done & Return</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {onboardError ? <Text style={styles.errorBanner}>{onboardError}</Text> : null}

                  <Text style={styles.inputLabel}>Trainer / Faculty Full Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={teacherName}
                    onChangeText={setTeacherName}
                    placeholder="e.g. Ramesh Kulkarni"
                    placeholderTextColor="#64748B"
                  />

                  <Text style={styles.inputLabel}>Faculty Email Address (Username) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={teacherEmail}
                    onChangeText={setTeacherEmail}
                    placeholder="e.g. ramesh.k@morphacademy.com"
                    placeholderTextColor="#64748B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Default Password</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={teacherPassword}
                    onChangeText={setTeacherPassword}
                    placeholder="Teacher@12345"
                    placeholderTextColor="#64748B"
                  />

                  <Text style={styles.inputLabel}>Assign Primary Course Track</Text>
                  <View style={styles.pillsRow}>
                    {[
                      { id: 3, name: '3D Animation Masterclass' },
                      { id: 4, name: 'VFX & Film Compositing' },
                      { id: 15, name: 'Full Stack Development' },
                      { id: 14, name: 'Digital Marketing & AI' },
                    ].map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.selectPill,
                          selectedCourseId === c.id && styles.selectPillActive,
                        ]}
                        onPress={() => setSelectedCourseId(c.id)}
                      >
                        <Text
                          style={[
                            styles.selectPillText,
                            selectedCourseId === c.id && styles.selectPillTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Assign Teaching Cohort / Batch</Text>
                  <View style={styles.pillsRow}>
                    {[
                      { id: 1, name: 'Maya 3D — Batch A' },
                      { id: 2, name: 'Maya 3D — Batch B' },
                      { id: 3, name: 'VFX Compositing — Batch A' },
                      { id: 4, name: 'Digital Marketing — Morning Batch' },
                    ].map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.selectPill,
                          selectedBatchId === b.id && styles.selectPillActive,
                        ]}
                        onPress={() => setSelectedBatchId(b.id)}
                      >
                        <Text
                          style={[
                            styles.selectPillText,
                            selectedBatchId === b.id && styles.selectPillTextActive,
                          ]}
                        >
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setOnboardModalVisible(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                      onPress={handleOnboardSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Text style={styles.submitBtnText}>
                          ✓ Confirm & Onboard Faculty
                        </Text>
                      )}
                    </TouchableOpacity>
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
 backgroundColor: '#0c0f17',
 },
 header: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingHorizontal: 22,
 paddingVertical: 16,
 backgroundColor: '#121622',
 borderBottomWidth: 1,
 borderBottomColor: '#1e2638',
 flexWrap: 'wrap',
 gap: 10,
 },
 headerBadge: {
 color: '#F59E0B',
 fontSize: 10,
 fontWeight: '800',
 letterSpacing: 1.2,
 marginBottom: 2,
 },
 headerTitle: {
 color: '#FFFFFF',
 fontSize: 22,
 fontWeight: '900',
 },
 headerSubtitle: {
 color: '#94A3B8',
 fontSize: 12,
 },
 headerBtnRow: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 10,
 },
 onboardBtn: {
 backgroundColor: '#F59E0B',
 paddingHorizontal: 14,
 paddingVertical: 9,
 borderRadius: 8,
 },
 onboardBtnText: {
 color: '#000000',
 fontSize: 12,
 fontWeight: '900',
 },
 refreshBtn: {
 backgroundColor: '#1a2030',
 paddingHorizontal: 14,
 paddingVertical: 9,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: '#2c364d',
 },
 refreshBtnText: {
 color: '#FFFFFF',
 fontSize: 12,
 fontWeight: '700',
 },
 searchBox: {
 flexDirection: 'row',
 alignItems: 'center',
 marginHorizontal: 22,
 marginTop: 16,
 backgroundColor: '#121622',
 borderRadius: 10,
 paddingHorizontal: 14,
 paddingVertical: 10,
 borderWidth: 1,
 borderColor: '#1e2638',
 },
 searchIcon: {
 fontSize: 14,
 marginRight: 8,
 },
 searchInput: {
 flex: 1,
 color: '#FFFFFF',
 fontSize: 13,
 },
 list: {
 flex: 1,
 paddingHorizontal: 22,
 paddingTop: 14,
 },
 countText: {
 color: '#64748B',
 fontSize: 12,
 fontWeight: '600',
 marginBottom: 14,
 },
 cardsGrid: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 16,
 },
 teacherCard: {
 flex: 1,
 minWidth: 320,
 maxWidth: 420,
 backgroundColor: '#121622',
 borderRadius: 14,
 padding: 16,
 borderWidth: 1,
 borderColor: '#1e2638',
 },
 cardHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 12,
 marginBottom: 12,
 },
 avatarCircle: {
 width: 44,
 height: 44,
 borderRadius: 22,
 backgroundColor: 'rgba(245, 158, 11, 0.15)',
 borderWidth: 1.5,
 borderColor: '#F59E0B',
 alignItems: 'center',
 justifyContent: 'center',
 },
 avatarText: {
 color: '#F59E0B',
 fontSize: 16,
 fontWeight: '900',
 },
 teacherName: {
 color: '#FFFFFF',
 fontSize: 15,
 fontWeight: '800',
 },
 teacherEmail: {
 color: '#94A3B8',
 fontSize: 12,
 marginTop: 1,
 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeHoliday: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusBadgeAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  statusBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  coursePill: {
    backgroundColor: '#1a2030',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2c364d',
  },
  coursePillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  batchPill: {
    backgroundColor: '#0c0f17',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  batchPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  noneText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e2638',
    gap: 8,
  },
  loginHintText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  statusActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  holidayBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  holidayBtnText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  absentBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  absentBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  onlineBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  onlineBtnText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
 centerBox: {
 alignItems: 'center',
 justifyContent: 'center',
 paddingVertical: 50,
 gap: 10,
 },
 loadingText: {
 color: '#94A3B8',
 fontSize: 13,
 },
 errorText: {
 color: '#EF4444',
 fontSize: 13,
 },
 retryBtn: {
 backgroundColor: '#F59E0B',
 paddingHorizontal: 14,
 paddingVertical: 8,
 borderRadius: 6,
 },
 retryBtnText: {
 color: '#000000',
 fontWeight: '800',
 },
 emptyIcon: {
 fontSize: 36,
 marginBottom: 6,
 },
 emptyTitle: {
 color: '#FFFFFF',
 fontSize: 16,
 fontWeight: '800',
 },
 emptySubtitle: {
 color: '#94A3B8',
 fontSize: 12,
 },
 modalBackdrop: {
 flex: 1,
 backgroundColor: 'rgba(0, 0, 0, 0.8)',
 justifyContent: 'center',
 alignItems: 'center',
 padding: 16,
 },
 modalCard: {
 width: '100%',
 maxWidth: 540,
 maxHeight: '90%',
 backgroundColor: '#121622',
 borderRadius: 16,
 borderWidth: 1,
 borderColor: '#1e2638',
 overflow: 'hidden',
 },
 modalHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 padding: 16,
 backgroundColor: '#0c0f17',
 borderBottomWidth: 1,
 borderBottomColor: '#1e2638',
 },
 modalTitle: {
 color: '#FFFFFF',
 fontSize: 16,
 fontWeight: '800',
 },
 modalSub: {
 color: '#94A3B8',
 fontSize: 11,
 marginTop: 2,
 },
 closeBtn: {
 width: 32,
 height: 32,
 borderRadius: 16,
 backgroundColor: '#1a2030',
 alignItems: 'center',
 justifyContent: 'center',
 },
 closeBtnText: {
 color: '#94A3B8',
 fontSize: 14,
 fontWeight: 'bold',
 },
 modalBody: {
 padding: 16,
 },
 inputLabel: {
 color: '#94A3B8',
 fontSize: 11,
 fontWeight: '700',
 marginBottom: 6,
 marginTop: 10,
 },
 modalInput: {
 backgroundColor: '#0c0f17',
 borderWidth: 1,
 borderColor: '#1e2638',
 borderRadius: 8,
 color: '#FFFFFF',
 paddingHorizontal: 12,
 paddingVertical: 9,
 fontSize: 13,
 },
 selectPill: {
 backgroundColor: '#0c0f17',
 borderWidth: 1,
 borderColor: '#1e2638',
 borderRadius: 6,
 paddingHorizontal: 10,
 paddingVertical: 7,
 },
 selectPillActive: {
 backgroundColor: 'rgba(245, 158, 11, 0.15)',
 borderColor: '#F59E0B',
 },
 selectPillText: {
 color: '#94A3B8',
 fontSize: 11,
 fontWeight: '600',
 },
 selectPillTextActive: {
 color: '#F59E0B',
 fontWeight: '800',
 },
 btnRow: {
 flexDirection: 'row',
 gap: 10,
 marginTop: 20,
 marginBottom: 10,
 },
 cancelBtn: {
 flex: 1,
 paddingVertical: 11,
 borderRadius: 8,
 backgroundColor: '#1a2030',
 alignItems: 'center',
 },
 cancelBtnText: {
 color: '#94A3B8',
 fontSize: 12,
 fontWeight: '700',
 },
 submitBtn: {
 flex: 2,
 paddingVertical: 11,
 borderRadius: 8,
 backgroundColor: '#F59E0B',
 alignItems: 'center',
 },
 submitBtnText: {
 color: '#000000',
 fontSize: 12,
 fontWeight: '900',
 },
 errorBanner: {
 color: '#EF4444',
 fontSize: 12,
 backgroundColor: 'rgba(239, 68, 68, 0.1)',
 padding: 8,
 borderRadius: 6,
 marginBottom: 10,
 },
 successCard: {
 padding: 10,
 alignItems: 'center',
 },
 successTitle: {
 color: '#10B981',
 fontSize: 18,
 fontWeight: '900',
 marginBottom: 6,
 textAlign: 'center',
 },
 successSub: {
 color: '#94A3B8',
 fontSize: 12,
 marginBottom: 16,
 textAlign: 'center',
 },
 credBox: {
 width: '100%',
 backgroundColor: '#0c0f17',
 borderRadius: 10,
 borderWidth: 1,
 borderColor: '#1e2638',
 padding: 14,
 gap: 10,
 marginBottom: 14,
 },
 credRow: {
 fontSize: 13,
 },
 credLabel: {
 color: '#64748B',
 fontWeight: '700',
 },
 credVal: {
 color: '#FFFFFF',
 fontWeight: '700',
 },
 onboardNote: {
 color: '#64748B',
 fontSize: 11,
 fontStyle: 'italic',
 textAlign: 'center',
 marginBottom: 18,
 },
 doneBtn: {
 width: '100%',
 backgroundColor: '#10B981',
 paddingVertical: 12,
 borderRadius: 8,
 alignItems: 'center',
 },
 doneBtnText: {
 color: '#000000',
 fontWeight: '900',
 fontSize: 13,
 },
});
