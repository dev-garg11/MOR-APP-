import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdminLoginScreen } from './src/screens/admin/AdminLoginScreen';
import { CourseManagementScreen } from './src/screens/admin/CourseManagementScreen';
import { DashboardOverviewScreen } from './src/screens/admin/DashboardOverviewScreen';
import { FeeManagerScreen } from './src/screens/admin/FeeManagerScreen';
import { HrDashboardScreen } from './src/screens/admin/HrDashboardScreen';
import { LeadsCrmScreen } from './src/screens/admin/LeadsCrmScreen';
import { StudentsDirectoryScreen } from './src/screens/admin/StudentsDirectoryScreen';
import { TeachersDirectoryScreen } from './src/screens/admin/TeachersDirectoryScreen';
import { TrainerAttendanceScreen } from './src/screens/admin/TrainerAttendanceScreen';
import { HomeScreen } from './src/screens/public/HomeScreen';
import { PublicNavigator } from './src/screens/public/PublicNavigator';
import { StudentDashboardScreen } from './src/screens/student/StudentDashboardScreen';
import { StudentLoginScreen } from './src/screens/student/StudentLoginScreen';
import { TeacherLoginScreen } from './src/screens/teacher/TeacherLoginScreen';
import { TeacherPortal } from './src/screens/teacher/TeacherPortal';
import { logoutAdmin } from './src/services/endpoints';
import { tokenStorage } from './src/services/tokenStorage';
import { theme } from './src/theme';

export default function App() {
  // 'public' | 'admin' | 'student' | 'teacher'
  const [currentPortal, setCurrentPortal] = useState('public');
  // 'dashboard' | 'courses' | 'leads' | 'students' | 'fees' | 'attendance'
  const [adminTab, setAdminTab] = useState('dashboard');

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check for existing sessions on load
    const checkSessions = async () => {
      try {
        const adminTok = await tokenStorage.getAdminToken();
        const adminProf = await tokenStorage.getAdminProfile();
        const studentTok = await tokenStorage.getStudentToken();
        setIsAdminLoggedIn(Boolean(adminTok));
        setIsStudentLoggedIn(Boolean(studentTok));

        if (adminTok && adminProf?.role) {
          const r = String(adminProf.role).toLowerCase();
          if (r === 'teacher' || r === 'trainer') {
            setUserRole('teacher');
          } else {
            setUserRole('admin');
          }
        }
      } catch (_e) {
        // ignore
      } finally {
        setInitializing(false);
      }
    };
    checkSessions();
  }, []);

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setIsAdminLoggedIn(false);
    setUserRole('admin');
    setCurrentPortal('public');
  };

  const handleStaffLoginSuccess = (role) => {
    setIsAdminLoggedIn(true);
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole === 'teacher' || normalizedRole === 'trainer') {
      setUserRole('teacher');
      setCurrentPortal('teacher');
    } else {
      setUserRole('admin');
      setCurrentPortal('admin');
    }
  };

  if (initializing) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // --- 1. STUDENT PORTAL ---
  if (currentPortal === 'student') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        {isStudentLoggedIn ? (
          <StudentDashboardScreen
            onLogout={() => {
              setIsStudentLoggedIn(false);
              setCurrentPortal('public');
            }}
          />
        ) : (
          <StudentLoginScreen
            onLoginSuccess={() => setIsStudentLoggedIn(true)}
            onBackToHome={() => setCurrentPortal('public')}
          />
        )}
      </SafeAreaView>
    );
  }

  // --- 2. TEACHER PORTAL ---
  if (currentPortal === 'teacher') {
    if (!isAdminLoggedIn || (userRole !== 'teacher' && userRole !== 'trainer')) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <TeacherLoginScreen
            onLoginSuccess={handleStaffLoginSuccess}
            onBackToHome={() => setCurrentPortal('public')}
          />
        </SafeAreaView>
      );
    }

    return (
      <TeacherPortal
        onLogout={handleAdminLogout}
        onSwitchPublic={() => setCurrentPortal('public')}
      />
    );
  }

  // --- 3. ADMIN / MANAGEMENT PORTAL ---
  if (currentPortal === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <AdminLoginScreen
            onLoginSuccess={handleStaffLoginSuccess}
            onBackToHome={() => setCurrentPortal('public')}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        {/* Admin Navigation Bar */}
        <View style={styles.adminNavBar}>
          <View style={styles.adminHeaderTop}>
            <View style={styles.adminBrand}>
              <View style={styles.adminLogo}>
                <Text style={styles.adminLogoText}>M</Text>
              </View>
              <View>
                <Text style={styles.adminBrandName}>MORPH ADMISSIONS & CRM</Text>
                <Text style={styles.adminBrandSub}>COUNSELOR & ADMISSIONS DESK</Text>
              </View>
            </View>

            {/* Right Quick Actions */}
            <View style={styles.adminNavRight}>
              <TouchableOpacity
                style={styles.switchTeacherBtn}
                onPress={() => setCurrentPortal('teacher')}
                activeOpacity={0.8}
              >
                <Text style={styles.switchTeacherText}>🎓 Faculty ↗</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchPublicBtn}
                onPress={() => setCurrentPortal('public')}
                activeOpacity={0.8}
              >
                <Text style={styles.switchPublicText}>🌐 Website</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleAdminLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Smooth Horizontal Scrollable Navigation Tabs */}
          <View style={styles.adminTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.adminTabsScrollContent}
            >
              {[
                { id: 'dashboard', label: '📊 Overview' },
                { id: 'leads', label: '🎯 HR & Enquiries' },
                { id: 'students', label: '🎓 Students' },
                { id: 'teachers', label: '🧑‍🏫 Faculty' },
                { id: 'fees', label: '💳 Fee Manager' },
                { id: 'courses', label: '📚 Courses' },
                { id: 'attendance', label: '📅 Attendance' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.adminTabBtn, adminTab === tab.id && styles.adminTabBtnActive]}
                  onPress={() => setAdminTab(tab.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.adminTabBtnText,
                      adminTab === tab.id && styles.adminTabBtnTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Admin Active Tab Content */}
        <View style={styles.adminContent}>
          {adminTab === 'dashboard' && (
            <DashboardOverviewScreen onNavigate={(screenKey) => setAdminTab(screenKey)} />
          )}
          {adminTab === 'courses' && <CourseManagementScreen />}
          {adminTab === 'leads' && <HrDashboardScreen />}
          {adminTab === 'students' && (
            <StudentsDirectoryScreen onNavigate={(screenKey) => setAdminTab(screenKey)} />
          )}
          {adminTab === 'teachers' && <TeachersDirectoryScreen />}
          {adminTab === 'fees' && <FeeManagerScreen />}
          {adminTab === 'attendance' && <TrainerAttendanceScreen />}
        </View>
      </SafeAreaView>
    );
  }

  // --- 4. PUBLIC ACADEMY EXPERIENCE (SPLASH, ONBOARDING, HOME, COURSES, DETAILS, ENQUIRY) ---
  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <PublicNavigator
        onOpenAdmin={() => setCurrentPortal('admin')}
        onOpenStudentPortal={() => setCurrentPortal('student')}
        onOpenTeacher={() => setCurrentPortal('teacher')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    width: '100%',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminNavBar: {
    backgroundColor: theme.colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 8,
  },
  adminHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    flexWrap: 'wrap',
  },
  adminBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminLogo: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  adminLogoText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },
  adminBrandName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adminBrandSub: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  adminNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchTeacherBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  switchTeacherText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  switchPublicBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
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
    borderColor: theme.colors.dangerLight,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  adminTabsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
  },
  adminTabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  adminTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  adminTabBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  adminTabBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  adminTabBtnTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  adminContent: {
    flex: 1,
  },
});
