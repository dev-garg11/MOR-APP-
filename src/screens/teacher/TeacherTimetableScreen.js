import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

const DAYS_FILTER = ['All Days', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TeacherTimetableScreen({ onOpenAttendance, onOpenBatch }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const loadTimetable = useCallback(async () => {
    try {
      setError('');
      const res = await teacherEndpoints.getTimetable();
      if (res.ok && res.data) {
        setTimetable(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load timetable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTimetable();
  };

  const filteredTimetable = useMemo(() => {
    return timetable.filter((item) => {
      // Day filter
      const matchesDay =
        selectedDay === 'All Days' ||
        (item.days && item.days.toLowerCase().includes(selectedDay.toLowerCase()));

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.course_name && item.course_name.toLowerCase().includes(q)) ||
        (item.batch_name && item.batch_name.toLowerCase().includes(q)) ||
        (item.timing && item.timing.toLowerCase().includes(q)) ||
        (item.room && item.room.toLowerCase().includes(q));

      return matchesDay && matchesSearch;
    });
  }, [timetable, selectedDay, searchQuery]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading class schedule & timetable...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerBadge}>WEEKLY TIMETABLE</Text>
        <Text style={styles.headerTitle}>Faculty Teaching Schedule</Text>
        <Text style={styles.headerSub}>
          Live timetable derived from assigned batch timings and studio lab bookings ({timetable.length} Active Batches)
        </Text>

        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="🔍 Search schedule by course, batch name, or time slot..."
          placeholderTextColor={theme.colors.textMuted}
        />

        {/* Day Filter Pills */}
        <View style={styles.dayFilterRow}>
          {DAYS_FILTER.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayPill,
                selectedDay === day && styles.dayPillActive,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayPillText,
                  selectedDay === day && styles.dayPillTextActive,
                ]}
              >
                {day === 'All Days' ? '🌟 All Days' : day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {filteredTimetable.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🗓</Text>
          <Text style={styles.emptyTitle}>No Scheduled Classes Found</Text>
          <Text style={styles.emptySub}>
            {searchQuery || selectedDay !== 'All Days'
              ? 'No classes match your current day or search filter.'
              : 'Classes will appear once batches are assigned to your faculty profile.'}
          </Text>
        </View>
      ) : (
        <View style={styles.scheduleList}>
          {filteredTimetable.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.scheduleCard}
              activeOpacity={0.85}
              onPress={() => setSelectedItem(item)}
            >
              <View style={styles.timeRow}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>⏰ {item.timing}</Text>
                </View>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysText}>🗓 {item.days}</Text>
                </View>
              </View>

              <Text style={styles.courseTitle}>{item.course_name}</Text>
              <Text style={styles.batchTitle}>Batch: {item.batch_name}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📍 {item.room}</Text>
                <Text style={styles.metaText}>👥 {item.student_count} Students</Text>
                <Text style={styles.statusText}>🟢 {item.status.toUpperCase()}</Text>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardDetailsBtn}
                  onPress={() => setSelectedItem(item)}
                >
                  <Text style={styles.cardDetailsBtnText}>🔍 Full Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attendanceBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    onOpenAttendance(item.batch_id);
                  }}
                >
                  <Text style={styles.attendanceBtnText}>📅 Open Attendance Roster ➔</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* FULL BATCH SCHEDULE DETAIL MODAL */}
      <Modal
        visible={Boolean(selectedItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalBadge}>BATCH TIMETABLE DETAILS</Text>
                <Text style={styles.modalTitle}>{selectedItem?.batch_name}</Text>
                <Text style={styles.modalSub}>{selectedItem?.course_name}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Detail Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>⏰ CLASS TIMING</Text>
                  <Text style={styles.infoValHighlight}>{selectedItem?.timing}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>🗓️ SCHEDULED DAYS</Text>
                  <Text style={styles.infoVal}>{selectedItem?.days}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>📍 STUDIO LOCATION</Text>
                  <Text style={styles.infoVal}>{selectedItem?.room}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>👥 ENROLLED STUDENTS</Text>
                  <Text style={[styles.infoVal, { color: '#10B981', fontWeight: '900' }]}>
                    {selectedItem?.student_count} Enrolled
                  </Text>
                </View>
              </View>

              {/* Status Note */}
              <View style={styles.scheduleNoteCard}>
                <Text style={styles.scheduleNoteTitle}>⚡ Faculty Class Instructions</Text>
                <Text style={styles.scheduleNoteText}>
                  Please ensure daily attendance is recorded at the start of each session. Topic progress is automatically synced with the student's learning tracker upon marking syllabus topics complete.
                </Text>
              </View>

              {/* Quick Actions in Modal */}
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.modalAttendanceBtn}
                  onPress={() => {
                    const bId = selectedItem?.batch_id;
                    setSelectedItem(null);
                    if (onOpenAttendance) onOpenAttendance(bId);
                  }}
                >
                  <Text style={styles.modalAttendanceBtnText}>
                    📅 Open Daily Attendance Sheet
                  </Text>
                </TouchableOpacity>

                {onOpenBatch ? (
                  <TouchableOpacity
                    style={styles.modalBatchBtn}
                    onPress={() => {
                      const bId = selectedItem?.batch_id;
                      setSelectedItem(null);
                      onOpenBatch(bId);
                    }}
                  >
                    <Text style={styles.modalBatchBtnText}>
                      👥 Go to Batch Students & Syllabus ➔
                    </Text>
                  </TouchableOpacity>
                ) : null}
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
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  headerCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: theme.colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  dayFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayPillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  dayPillTextActive: {
    color: '#000000',
    fontWeight: '900',
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
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  timeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.xs,
  },
  timeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
  },
  daysBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  daysText: {
    color: theme.colors.accentSlate,
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  batchTitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: theme.radius.xs,
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  statusText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  cardDetailsBtn: {
    flex: 1,
    minWidth: 110,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardDetailsBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  attendanceBtn: {
    flex: 2,
    minWidth: 180,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  attendanceBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#161b2a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2638',
  },
  modalBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0c0f17',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoValHighlight: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  scheduleNoteCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  scheduleNoteTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  scheduleNoteText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  modalActionButtons: {
    gap: 10,
    marginBottom: 10,
  },
  modalAttendanceBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalAttendanceBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  modalBatchBtn: {
    backgroundColor: '#1a2030',
    borderWidth: 1,
    borderColor: '#2c364d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBatchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});


