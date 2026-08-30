import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { listAttendance, listStudents, markAttendance } from '../../services/endpoints';
import { theme } from '../../theme';

export function TrainerAttendanceScreen() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        listStudents(),
        listAttendance({ date: selectedDate }),
      ]);

      setStudents(studentsRes.data || []);

      const attMap = {};
      (attendanceRes.data || []).forEach((rec) => {
        attMap[rec.student_id] = rec.status;
      });
      setAttendanceRecords(attMap);
    } catch (err) {
      setError(err.message || 'Could not load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleMark = async (studentId, status) => {
    setSavingId(studentId);
    try {
      await markAttendance({
        student_id: studentId,
        date: selectedDate,
        status: status,
      });

      setAttendanceRecords((prev) => ({
        ...prev,
        [studentId]: status,
      }));
    } catch (err) {
      alert(`Failed to mark attendance: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    for (const stu of students) {
      if (attendanceRecords[stu.id] !== 'present') {
        try {
          await markAttendance({
            student_id: stu.id,
            date: selectedDate,
            status: 'present',
          });
        } catch (_e) {}
      }
    }
    loadData();
  };

  const presentCount = Object.values(attendanceRecords).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter((s) => s === 'absent').length;
  const leaveCount = Object.values(attendanceRecords).filter((s) => s === 'leave').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>DAILY CLASS LOGS</Text>
          <Text style={styles.headerTitle}>Trainer Attendance Sheet</Text>
          <Text style={styles.headerSubtitle}>
            Mark daily attendance for {selectedDate}
          </Text>
        </View>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllPresent}>
          <Text style={styles.markAllBtnText}>✓ Mark All Present</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Summary Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL STUDENTS</Text>
          <Text style={styles.statVal}>{students.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PRESENT</Text>
          <Text style={[styles.statVal, { color: '#22C55E' }]}>{presentCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ABSENT</Text>
          <Text style={[styles.statVal, { color: '#EF4444' }]}>{absentCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>LEAVE</Text>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>{leaveCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ATTENDANCE RATE</Text>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>
            {students.length > 0 ? `${Math.round((presentCount / students.length) * 100)}%` : '0%'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading class attendance...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No enrolled students yet</Text>
          <Text style={styles.emptySubtitle}>Admit students first from the Lead CRM.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {/* Responsive Attendance Cards Grid */}
          <View style={styles.cardsGrid}>
            {students.map((stu) => {
              const currentStatus = attendanceRecords[stu.id];
              const isSaving = savingId === stu.id;
              const initials = stu.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              return (
                <View key={stu.id} style={styles.attendanceCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{initials || 'ST'}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {stu.name}
                      </Text>
                      <Text style={styles.studentMeta} numberOfLines={1}>
                        {stu.login_id || `ID: #${stu.id}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.courseTag}>
                    <Text style={styles.courseTagText} numberOfLines={1}>
                      🎯 {stu.course}
                    </Text>
                  </View>

                  {isSaving ? (
                    <View style={styles.savingBox}>
                      <ActivityIndicator size="small" color="#F59E0B" />
                      <Text style={styles.savingText}>Updating status...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnGroup}>
                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          currentStatus === 'present' && styles.presentActive,
                        ]}
                        onPress={() => handleMark(stu.id, 'present')}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            currentStatus === 'present' && styles.toggleActiveText,
                          ]}
                        >
                          ✓ Present
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          currentStatus === 'absent' && styles.absentActive,
                        ]}
                        onPress={() => handleMark(stu.id, 'absent')}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            currentStatus === 'absent' && styles.toggleActiveText,
                          ]}
                        >
                          ✕ Absent
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.toggleBtn,
                          currentStatus === 'leave' && styles.leaveActive,
                        ]}
                        onPress={() => handleMark(stu.id, 'leave')}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            currentStatus === 'leave' && styles.toggleActiveText,
                          ]}
                        >
                          ⏳ Leave
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0f17',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
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
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  markAllBtn: {
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  markAllBtnText: {
    color: '#22C55E',
    fontWeight: '800',
    fontSize: 12,
  },
  statsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#121622',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e2638',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  list: {
    flex: 1,
  },
  /* Responsive Cards Grid */
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  attendanceCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 360,
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  studentMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  courseTag: {
    backgroundColor: '#0c0f17',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1e2638',
    marginBottom: 12,
  },
  courseTagText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e2638',
    alignItems: 'center',
  },
  presentActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  absentActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  leaveActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  toggleBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  toggleActiveText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  savingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  savingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#000000',
    fontWeight: '800',
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
