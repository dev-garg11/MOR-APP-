import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { teacherEndpoints } from '../../services/endpoints';
import { theme } from '../../theme';

export function TeacherDashboardScreen({ onNavigate, onOpenBatch, onOpenAttendance, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await teacherEndpoints.getDashboard();
      if (res.ok && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load teacher dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Teacher Portal...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Faculty Session Notice</Text>
        <Text style={styles.errorText}>{error}</Text>

        <View style={styles.errorActionsRow}>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDashboard}>
            <Text style={styles.retryBtnText}>↻ Try Again</Text>
          </TouchableOpacity>
          {onLogout ? (
            <TouchableOpacity style={styles.reloginBtn} onPress={onLogout}>
              <Text style={styles.reloginBtnText}>🔑 Sign In to Faculty Portal</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const { teacher, summary, today_classes = [], assigned_batches = [], recent_activity = [] } = data || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* 1. TEACHER WELCOME HEADER */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeLeft}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {teacher?.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
            </Text>
          </View>
          <View>
            <View style={styles.roleRow}>
              <Text style={styles.roleBadge}>FACULTY / TRAINER</Text>
              <View style={styles.activeDot} />
              <Text style={styles.activeStatusText}>Online</Text>
            </View>
            <Text style={styles.teacherName}>{teacher?.name || 'Faculty Member'}</Text>
            <Text style={styles.teacherSub}>{teacher?.department || 'Creative Tech & 3D Department'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.quickProfileBtn} onPress={() => onNavigate('profile')}>
          <Text style={styles.quickProfileText}>Profile ➔</Text>
        </TouchableOpacity>
      </View>

      {/* 2. REAL METRIC KPI CARDS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overview & Live Metrics</Text>
        <Text style={styles.sectionSub}>Real-time academy teaching data</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Card 1: My Courses */}
        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('courses')}>
          <View style={styles.statIconBadge}>
            <Text style={styles.statIcon}>📚</Text>
          </View>
          <Text style={styles.statNumber}>{summary?.my_courses_count ?? 0}</Text>
          <Text style={styles.statLabel}>My Courses</Text>
          <Text style={styles.statFooter}>Assigned to teach</Text>
        </TouchableOpacity>

        {/* Card 2: My Batches */}
        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('batches')}>
          <View style={[styles.statIconBadge, { backgroundColor: theme.colors.accentCyanLight }]}>
            <Text style={styles.statIcon}>👥</Text>
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.accentCyan }]}>
            {summary?.my_batches_count ?? 0}
          </Text>
          <Text style={styles.statLabel}>My Batches</Text>
          <Text style={styles.statFooter}>Active cohorts</Text>
        </TouchableOpacity>

        {/* Card 3: Total Students */}
        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('students')}>
          <View style={[styles.statIconBadge, { backgroundColor: theme.colors.successLight }]}>
            <Text style={styles.statIcon}>🎓</Text>
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {summary?.total_students_count ?? 0}
          </Text>
          <Text style={styles.statLabel}>Total Students</Text>
          <Text style={styles.statFooter}>Enrolled in my batches</Text>
        </TouchableOpacity>

        {/* Card 4: Today's Classes */}
        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('timetable')}>
          <View style={[styles.statIconBadge, { backgroundColor: theme.colors.accentPurpleLight }]}>
            <Text style={styles.statIcon}>🗓</Text>
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.accentPurple }]}>
            {summary?.today_classes_count ?? 0}
          </Text>
          <Text style={styles.statLabel}>Today's Classes</Text>
          <Text style={styles.statFooter}>Scheduled sessions</Text>
        </TouchableOpacity>

        {/* Card 5: Pending Assignments */}
        <TouchableOpacity style={styles.statCard} onPress={() => onNavigate('assignments')}>
          <View style={[styles.statIconBadge, { backgroundColor: theme.colors.warningLight }]}>
            <Text style={styles.statIcon}>📝</Text>
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
            {summary?.pending_assignments_count ?? 0}
          </Text>
          <Text style={styles.statLabel}>Assignments</Text>
          <Text style={styles.statFooter}>Pending reviews</Text>
        </TouchableOpacity>

        {/* Card 6: Attendance Status */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => {
            if (assigned_batches.length > 0) {
              onOpenAttendance(assigned_batches[0].id);
            } else {
              onNavigate('batches');
            }
          }}
        >
          <View style={[styles.statIconBadge, { backgroundColor: theme.colors.infoLight }]}>
            <Text style={styles.statIcon}>📅</Text>
          </View>
          <Text style={[styles.statNumber, { color: theme.colors.info }]}>
            {summary?.today_attendance_rate ?? '0%'}
          </Text>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={styles.statFooter}>
            {summary?.today_attendance_marked_count ?? 0}/{summary?.today_attendance_total_count ?? 0} Batches Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. QUICK ACTIONS */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('courses')}>
          <Text style={styles.actionBtnIcon}>📚</Text>
          <Text style={styles.actionBtnText}>My Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('batches')}>
          <Text style={styles.actionBtnIcon}>👥</Text>
          <Text style={styles.actionBtnText}>My Batches</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('students')}>
          <Text style={styles.actionBtnIcon}>🎓</Text>
          <Text style={styles.actionBtnText}>Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('timetable')}>
          <Text style={styles.actionBtnIcon}>🗓</Text>
          <Text style={styles.actionBtnText}>Timetable</Text>
        </TouchableOpacity>
      </View>

      {/* 4. TODAY'S CLASSES & SCHEDULE */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Today's Classes & Sessions</Text>
          <Text style={styles.sectionSub}>Mark attendance and manage scheduled classes</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('timetable')}>
          <Text style={styles.viewAllText}>Full Schedule ➔</Text>
        </TouchableOpacity>
      </View>

      {today_classes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🗓</Text>
          <Text style={styles.emptyTitle}>No Classes Scheduled for Today</Text>
          <Text style={styles.emptySub}>Your upcoming schedule will appear here automatically.</Text>
        </View>
      ) : (
        <View style={styles.classesList}>
          {today_classes.map((cls) => (
            <View key={cls.id} style={styles.classCard}>
              <View style={styles.classCardHeader}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{cls.timing}</Text>
                </View>
                <View
                  style={[
                    styles.attStatusBadge,
                    cls.attendance_marked ? styles.attStatusMarked : styles.attStatusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.attStatusText,
                      cls.attendance_marked ? styles.attStatusTextMarked : styles.attStatusTextPending,
                    ]}
                  >
                    {cls.attendance_marked ? '✓ Attendance Marked' : '⏳ Attendance Pending'}
                  </Text>
                </View>
              </View>

              <Text style={styles.classCourseTitle}>{cls.course_name}</Text>
              <Text style={styles.classBatchTitle}>Batch: {cls.batch_name}</Text>

              <View style={styles.classMetaRow}>
                <Text style={styles.classMetaText}>📍 {cls.room || 'Studio Lab 1'}</Text>
                <Text style={styles.classMetaText}>👥 {cls.students_count} Students</Text>
                <Text style={styles.classMetaText}>📅 {cls.days}</Text>
              </View>

              <View style={styles.classActionsRow}>
                <TouchableOpacity
                  style={[styles.takeAttBtn, cls.attendance_marked && styles.takeAttBtnOutline]}
                  onPress={() => onOpenAttendance(cls.batch_id)}
                >
                  <Text
                    style={[
                      styles.takeAttBtnText,
                      cls.attendance_marked && styles.takeAttBtnTextOutline,
                    ]}
                  >
                    {cls.attendance_marked ? '📝 Edit Attendance' : '✓ Mark Attendance'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.batchDetailBtn}
                  onPress={() => onOpenBatch(cls.batch_id)}
                >
                  <Text style={styles.batchDetailBtnText}>Batch Details ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 5. ASSIGNED BATCHES QUICK VIEW */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>My Assigned Batches</Text>
          <Text style={styles.sectionSub}>Batches actively assigned to your mentorship</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('batches')}>
          <Text style={styles.viewAllText}>View All ({assigned_batches.length}) ➔</Text>
        </TouchableOpacity>
      </View>

      {assigned_batches.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Batches Assigned Yet</Text>
          <Text style={styles.emptySub}>Contact Super Admin to assign training batches to your account.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.batchScroll}>
          {assigned_batches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.horizontalBatchCard}
              onPress={() => onOpenBatch(b.id)}
            >
              <View style={styles.hBatchTop}>
                <Text style={styles.hBatchStatus}>🟢 {b.status.toUpperCase()}</Text>
                <Text style={styles.hBatchStudents}>👥 {b.students_count} Students</Text>
              </View>
              <Text style={styles.hBatchName} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={styles.hBatchCourse} numberOfLines={1}>
                {b.course_name}
              </Text>
              <View style={styles.hBatchDivider} />
              <Text style={styles.hBatchTiming}>⏰ {b.timing || '10:00 AM - 12:00 PM'}</Text>
              <Text style={styles.hBatchDays}>🗓 {b.days || 'Mon, Wed, Fri'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 6. RECENT ACTIVITY */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity & Milestones</Text>
        <Text style={styles.sectionSub}>Latest teaching and attendance activity logs</Text>
      </View>

      <View style={styles.activityCard}>
        {recent_activity.map((act, index) => (
          <View
            key={act.id || String(index)}
            style={[
              styles.activityItem,
              index === recent_activity.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.activityDot} />
            <View style={styles.activityBody}>
              <Text style={styles.activityTitle}>{act.title}</Text>
              <Text style={styles.activitySubtitle}>{act.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
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
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 400,
  },
  errorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  retryBtnText: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 13,
  },
  reloginBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  reloginBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
    ...theme.shadows.sm,
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.textDark,
    fontSize: 22,
    fontWeight: '900',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  roleBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  activeStatusText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  teacherName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  teacherSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  quickProfileBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickProfileText: {
    color: theme.colors.accentSlate,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
  },
  statNumber: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statFooter: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  actionBtnIcon: {
    fontSize: 18,
  },
  actionBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  classesList: {
    gap: 12,
  },
  classCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  timeBadge: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  timeText: {
    color: theme.colors.accentCyan,
    fontSize: 11,
    fontWeight: '800',
  },
  attStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  attStatusMarked: {
    backgroundColor: theme.colors.successLight,
  },
  attStatusPending: {
    backgroundColor: theme.colors.warningLight,
  },
  attStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  attStatusTextMarked: {
    color: theme.colors.success,
  },
  attStatusTextPending: {
    color: theme.colors.warning,
  },
  classCourseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  classBatchTitle: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  classMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: theme.radius.xs,
  },
  classMetaText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  classActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  takeAttBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  takeAttBtnOutline: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  takeAttBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 12,
  },
  takeAttBtnTextOutline: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  batchDetailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  batchDetailBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  batchScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  horizontalBatchCard: {
    width: 220,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 12,
    ...theme.shadows.sm,
  },
  hBatchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hBatchStatus: {
    color: theme.colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
  hBatchStudents: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  hBatchName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  hBatchCourse: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginBottom: 8,
  },
  hBatchDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  hBatchTiming: {
    color: theme.colors.accentSlate,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  hBatchDays: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  activityCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 5,
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  activitySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
});

