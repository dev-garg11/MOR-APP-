import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme';
import { TeacherDashboardScreen } from './TeacherDashboardScreen';
import { TeacherCoursesScreen } from './TeacherCoursesScreen';
import { TeacherBatchesScreen } from './TeacherBatchesScreen';
import { TeacherStudentsScreen } from './TeacherStudentsScreen';
import { TeacherTimetableScreen } from './TeacherTimetableScreen';
import { TeacherProfileScreen } from './TeacherProfileScreen';
import { TeacherAssignmentsScreen } from './TeacherAssignmentsScreen';
import { TeacherAttendanceModal } from './TeacherAttendanceModal';

export function TeacherPortal({ onLogout, onSwitchPublic }) {
  // 'dashboard' | 'courses' | 'batches' | 'students' | 'assignments' | 'timetable' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Selected entities for deep-linking between screens
  const [targetBatchId, setTargetBatchId] = useState(null);
  const [targetStudentId, setTargetStudentId] = useState(null);

  // Attendance Modal State
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [attendanceBatchId, setAttendanceBatchId] = useState(null);

  const handleOpenAttendance = (batchId) => {
    setAttendanceBatchId(batchId);
    setAttendanceModalVisible(true);
  };

  const handleOpenBatch = (batchId) => {
    setTargetBatchId(batchId);
    setActiveTab('batches');
  };

  const handleOpenStudent = (studentId) => {
    setTargetStudentId(studentId);
    setActiveTab('students');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Faculty Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>MORPHY ACADEMY</Text>
            <Text style={styles.brandSub}>FACULTY & TRAINER PORTAL</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.navTabs}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'courses', label: '📚 My Courses' },
            { id: 'batches', label: '👥 My Batches' },
            { id: 'students', label: '🎓 Students' },
            { id: 'assignments', label: '📝 Assignments' },
            { id: 'timetable', label: '🗓 Timetable' },
            { id: 'profile', label: '👤 Profile' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => {
                if (tab.id !== 'batches') setTargetBatchId(null);
                if (tab.id !== 'students') setTargetStudentId(null);
                setActiveTab(tab.id);
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === tab.id && styles.tabBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Right Actions */}
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.switchPublicBtn} onPress={onSwitchPublic}>
            <Text style={styles.switchPublicText}>🌐 Website</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Tab Screen Content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && (
          <TeacherDashboardScreen
            onNavigate={(screenKey) => setActiveTab(screenKey)}
            onOpenBatch={handleOpenBatch}
            onOpenAttendance={handleOpenAttendance}
            onLogout={onLogout}
          />
        )}

        {activeTab === 'courses' && (
          <TeacherCoursesScreen onOpenBatch={handleOpenBatch} />
        )}

        {activeTab === 'batches' && (
          <TeacherBatchesScreen
            initialBatchId={targetBatchId}
            onOpenAttendance={handleOpenAttendance}
            onOpenStudent={handleOpenStudent}
            onOpenAssignments={() => setActiveTab('assignments')}
          />
        )}

        {activeTab === 'students' && (
          <TeacherStudentsScreen initialStudentId={targetStudentId} />
        )}

        {activeTab === 'assignments' && (
          <TeacherAssignmentsScreen />
        )}

        {activeTab === 'timetable' && (
          <TeacherTimetableScreen
            onOpenAttendance={handleOpenAttendance}
            onOpenBatch={handleOpenBatch}
          />
        )}

        {activeTab === 'profile' && (
          <TeacherProfileScreen
            onLogout={onLogout}
            onSwitchPublic={onSwitchPublic}
          />
        )}
      </View>

      {/* Global Attendance Modal */}
      <TeacherAttendanceModal
        visible={attendanceModalVisible}
        batchId={attendanceBatchId}
        onClose={() => {
          setAttendanceModalVisible(false);
          setAttendanceBatchId(null);
        }}
        onSaved={() => {
          // Re-renders naturally when modal closes
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    minHeight: '100vh',
    width: '100%',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexWrap: 'wrap',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: '900',
  },
  brandTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  brandSub: {
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  navTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  tabBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: theme.colors.primary,
  },
  navRight: {
    flexDirection: 'row',
    gap: 8,
  },
  switchPublicBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchPublicText: {
    color: theme.colors.accentSlate,
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});

