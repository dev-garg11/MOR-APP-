import React, { useEffect, useMemo, useState } from 'react';
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
import { StudentDetailModal } from '../../components/admin/StudentDetailModal';
import { createStudent, listStudents } from '../../services/endpoints';
import { theme } from '../../theme';

const AVAILABLE_COURSES = [
  '3D Animation Masterclass',
  'VFX & Film Compositing',
  'Full Stack Development',
  'Digital Marketing & AI Growth Hacking',
  'UI/UX Design Masterclass',
];

const AVAILABLE_BATCHES = [
  'Maya 3D — Batch A',
  'Maya 3D — Batch B',
  'VFX Compositing — Batch A',
  'Digital Marketing — Morning Batch',
  'Full Stack — Evening Batch',
];

export function StudentsDirectoryScreen({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // New Student Admission Modal
  const [admitModalVisible, setAdmitModalVisible] = useState(false);
  const [newStuName, setNewStuName] = useState('');
  const [newStuPhone, setNewStuPhone] = useState('');
  const [newStuEmail, setNewStuEmail] = useState('');
  const [newStuCourse, setNewStuCourse] = useState('3D Animation Masterclass');
  const [newStuBatch, setNewStuBatch] = useState('Maya 3D — Batch A');
  const [newStuMode, setNewStuMode] = useState('offline');
  const [newStuFeesTotal, setNewStuFeesTotal] = useState('75000');
  const [newStuFeesPaid, setNewStuFeesPaid] = useState('25000');
  const [newStuFeeDueDate, setNewStuFeeDueDate] = useState('2026-09-15');
  const [admitting, setAdmitting] = useState(false);
  const [admitSuccess, setAdmitSuccess] = useState(null);
  const [admitError, setAdmitError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listStudents();
      setStudents(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load students directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenAdmitModal = () => {
    setNewStuName('');
    setNewStuPhone('');
    setNewStuEmail('');
    setNewStuCourse('3D Animation Masterclass');
    setNewStuBatch('Maya 3D — Batch A');
    setNewStuMode('offline');
    setNewStuFeesTotal('75000');
    setNewStuFeesPaid('25000');
    setNewStuFeeDueDate('2026-09-15');
    setAdmitSuccess(null);
    setAdmitError('');
    setAdmitModalVisible(true);
  };

  const handleAdmitStudentSubmit = async () => {
    if (!newStuName.trim() || !newStuPhone.trim()) {
      setAdmitError('Please provide Student Full Name and Phone Number.');
      return;
    }

    setAdmitting(true);
    setAdmitError('');
    try {
      const payload = {
        name: newStuName.trim(),
        phone: newStuPhone.trim(),
        email: newStuEmail.trim() || `${newStuName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@morphacademy.com`,
        course: newStuCourse,
        batch: newStuBatch,
        mode: newStuMode,
        fees_total: parseFloat(newStuFeesTotal) || 0,
        fees_paid: parseFloat(newStuFeesPaid) || 0,
        fee_due_date: newStuFeeDueDate || null,
        status: 'active',
      };

      const res = await createStudent(payload);
      if (res.data) {
        setAdmitSuccess({
          name: res.data.name,
          login_id: res.data.login_id || `STU-${res.data.id}`,
          default_password: 'Student@12345',
          course: res.data.course,
          batch: res.data.batch,
        });
        fetchStudents();
      }
    } catch (err) {
      setAdmitError(err.message || 'Failed to admit student.');
    } finally {
      setAdmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchPhone = s.phone.includes(q);
      const matchLogin = (s.login_id || '').toLowerCase().includes(q);
      const matchCourse = (s.course || '').toLowerCase().includes(q);
      return !q || matchName || matchPhone || matchLogin || matchCourse;
    });
  }, [students, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerBadge}>ACADEMIC RECORDS</Text>
          <Text style={styles.headerTitle}>Enrolled Students Directory</Text>
          <Text style={styles.headerSubtitle}>
            Manage student credentials, batch allocations, and profile details.
          </Text>
        </View>
        <View style={styles.headerBtnRow}>
          <TouchableOpacity style={styles.admitBtn} onPress={handleOpenAdmitModal} activeOpacity={0.8}>
            <Text style={styles.admitBtnText}>➕ Admit Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchStudents} activeOpacity={0.8}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Filter Bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, roll ID (STU-xxxxx), phone, or course..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Students Grid List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading students from Neon database...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchStudents}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>No students found</Text>
          <Text style={styles.emptySubtitle}>
            Admit leads from the HR & Enquiries CRM to see them here.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countText}>
            Showing {filteredStudents.length} of {students.length} enrolled students
          </Text>

          {/* Genuine Responsive Cards Grid Layout */}
          <View style={styles.cardsGrid}>
            {filteredStudents.map((stu) => {
              const total = Number(stu.fees_total || 0);
              const paid = Number(stu.fees_paid || 0);
              const pending = total - paid;
              const initials = stu.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              return (
                <TouchableOpacity
                  key={stu.id}
                  style={styles.studentCard}
                  onPress={() => setSelectedStudent(stu)}
                  activeOpacity={0.85}
                >
                  {/* Card Header with Avatar & Badges */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{initials || 'ST'}</Text>
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {stu.name}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Text style={styles.rollBadge}>
                          {stu.login_id || `STU-${String(stu.id).padStart(5, '0')}`}
                        </Text>
                        <Text style={styles.modeBadge}>
                          {stu.mode?.toUpperCase() || 'OFFLINE'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Course Info */}
                  <View style={styles.courseBox}>
                    <Text style={styles.courseLabel}>ENROLLED COURSE</Text>
                    <Text style={styles.courseName} numberOfLines={1}>
                      🎯 {stu.course}
                    </Text>
                  </View>

                  {/* Contact Snippets */}
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactItem} numberOfLines={1}>
                      📞 {stu.phone}
                    </Text>
                    {stu.email ? (
                      <Text style={styles.contactItem} numberOfLines={1}>
                        ✉️ {stu.email}
                      </Text>
                    ) : null}
                    {stu.batch ? (
                      <Text style={styles.contactItem} numberOfLines={1}>
                        ⏰ {stu.batch}
                      </Text>
                    ) : null}
                  </View>

                  {/* Mini Financial Summary */}
                  <View style={styles.cardFeeSummary}>
                    <View style={styles.cardFeeCol}>
                      <Text style={styles.cardFeeLabel}>TOTAL</Text>
                      <Text style={styles.cardFeeVal}>₹{total.toLocaleString()}</Text>
                    </View>
                    <View style={styles.cardFeeCol}>
                      <Text style={styles.cardFeeLabel}>PAID</Text>
                      <Text style={[styles.cardFeeVal, { color: theme.colors.success }]}>
                        ₹{paid.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.cardFeeCol}>
                      <Text style={styles.cardFeeLabel}>DUE</Text>
                      <Text
                        style={[
                          styles.cardFeeVal,
                          { color: pending > 0 ? theme.colors.danger : theme.colors.textMuted },
                        ]}
                      >
                        ₹{pending.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom CTA Buttons */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.cardWaBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        const cleanPhone = stu.phone.replace(/[^0-9]/g, '');
                        const p = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                        Linking.openURL(`https://wa.me/${p}`);
                      }}
                    >
                      <Text style={styles.cardWaBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardViewBtn}
                      onPress={() => setSelectedStudent(stu)}
                    >
                      <Text style={styles.cardViewBtnText}>View Info ➔</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* Student Full Detail Modal */}
      <StudentDetailModal
        visible={Boolean(selectedStudent)}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onNavigate={onNavigate}
      />

      {/* DIRECT STUDENT ADMISSION MODAL */}
      <Modal
        visible={admitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAdmitModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.admitModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🎓 Register New Student Admission</Text>
                <Text style={styles.modalSub}>
                  Create student profile, auto-generate Roll ID & login credentials
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setAdmitModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {admitSuccess ? (
                <View style={styles.admitSuccessCard}>
                  <Text style={styles.admitSuccessTitle}>🎉 Student Enrolled Successfully!</Text>
                  <Text style={styles.admitSuccessSub}>
                    Official student credentials generated and saved to database:
                  </Text>
                  <View style={styles.credBox}>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Student Name: </Text>
                      <Text style={styles.credVal}>{admitSuccess.name}</Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Assigned Roll ID: </Text>
                      <Text style={[styles.credVal, { color: '#F59E0B', fontWeight: '900' }]}>
                        {admitSuccess.login_id}
                      </Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Default Password: </Text>
                      <Text style={[styles.credVal, { color: '#10B981', fontWeight: '900' }]}>
                        {admitSuccess.default_password}
                      </Text>
                    </Text>
                    <Text style={styles.credRow}>
                      <Text style={styles.credLabel}>Course & Batch: </Text>
                      <Text style={styles.credVal}>
                        {admitSuccess.course} ({admitSuccess.batch})
                      </Text>
                    </Text>
                  </View>
                  <Text style={styles.admitNote}>
                    Student can immediately sign in on the Student Portal using their Roll ID and password.
                  </Text>
                  <TouchableOpacity
                    style={styles.admitDoneBtn}
                    onPress={() => setAdmitModalVisible(false)}
                  >
                    <Text style={styles.admitDoneBtnText}>✓ Done & Return to Directory</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {admitError ? <Text style={styles.modalErrorText}>{admitError}</Text> : null}

                  <Text style={styles.inputLabel}>Student Full Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newStuName}
                    onChangeText={setNewStuName}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#64748B"
                  />

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Phone Number *</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newStuPhone}
                        onChangeText={setNewStuPhone}
                        placeholder="10-digit mobile"
                        placeholderTextColor="#64748B"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newStuEmail}
                        onChangeText={setNewStuEmail}
                        placeholder="student@example.com"
                        placeholderTextColor="#64748B"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Select Course Program *</Text>
                  <View style={styles.selectionPillsRow}>
                    {AVAILABLE_COURSES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.pillBtn,
                          newStuCourse === c && styles.pillBtnActive,
                        ]}
                        onPress={() => setNewStuCourse(c)}
                      >
                        <Text
                          style={[
                            styles.pillBtnText,
                            newStuCourse === c && styles.pillBtnTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Select Assigned Batch *</Text>
                  <View style={styles.selectionPillsRow}>
                    {AVAILABLE_BATCHES.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.pillBtn,
                          newStuBatch === b && styles.pillBtnActive,
                        ]}
                        onPress={() => setNewStuBatch(b)}
                      >
                        <Text
                          style={[
                            styles.pillBtnText,
                            newStuBatch === b && styles.pillBtnTextActive,
                          ]}
                        >
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Study Mode</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {['offline', 'online'].map((m) => (
                          <TouchableOpacity
                            key={m}
                            style={[
                              styles.pillBtn,
                              { flex: 1 },
                              newStuMode === m && styles.pillBtnActive,
                            ]}
                            onPress={() => setNewStuMode(m)}
                          >
                            <Text
                              style={[
                                styles.pillBtnText,
                                newStuMode === m && styles.pillBtnTextActive,
                              ]}
                            >
                              {m.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Next Fee Due Date</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newStuFeeDueDate}
                        onChangeText={setNewStuFeeDueDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Total Program Fees (₹)</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newStuFeesTotal}
                        onChangeText={setNewStuFeesTotal}
                        placeholder="e.g. 75000"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Initial Paid Down-Payment (₹)</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={newStuFeesPaid}
                        onChangeText={setNewStuFeesPaid}
                        placeholder="e.g. 25000"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setAdmitModalVisible(false)}
                    >
                      <Text style={styles.modalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalSubmitBtn, admitting && { opacity: 0.6 }]}
                      onPress={handleAdmitStudentSubmit}
                      disabled={admitting}
                    >
                      {admitting ? (
                        <ActivityIndicator size="small" color="#000000" />
                      ) : (
                        <Text style={styles.modalSubmitBtnText}>
                          ✓ Confirm Admission & Generate Roll ID
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#121622',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2638',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleBox: {
    flex: 1,
    minWidth: 260,
  },
  headerBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
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
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 16,
    paddingHorizontal: 4,
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
  /* Responsive Cards Grid Layout */
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  studentCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 380,
    backgroundColor: '#121622',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e2638',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  cardHeaderInfo: {
    flex: 1,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rollBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeBadge: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#1a2030',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseBox: {
    backgroundColor: '#0c0f17',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  courseLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  courseName: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  contactDetails: {
    gap: 4,
    marginBottom: 12,
  },
  contactItem: {
    color: '#94A3B8',
    fontSize: 12,
  },
  cardFeeSummary: {
    flexDirection: 'row',
    backgroundColor: '#0c0f17',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e2638',
    marginBottom: 12,
  },
  cardFeeCol: {
    flex: 1,
    alignItems: 'center',
  },
  cardFeeLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardFeeVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2638',
  },
  cardWaBtn: {
    backgroundColor: '#25D366',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cardWaBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  cardViewBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardViewBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
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
  headerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  admitBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  admitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  admitModalCard: {
    width: '100%',
    maxWidth: 560,
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
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  pillBtn: {
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  pillBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  pillBtnTextActive: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#1a2030',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  admitSuccessCard: {
    padding: 10,
    alignItems: 'center',
  },
  admitSuccessTitle: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  admitSuccessSub: {
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
  admitNote: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
  },
  admitDoneBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  admitDoneBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
});
