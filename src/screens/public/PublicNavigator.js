import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EnquiryModal } from '../../components/public/EnquiryModal';
import { MORPHY_COURSES } from '../../data/coursesData';
import { theme } from '../../theme';
import { AboutFacilitiesScreen } from './AboutFacilitiesScreen';
import { ContactScreen } from './ContactScreen';
import { CourseDetailsScreen } from './CourseDetailsScreen';
import { CoursesScreen } from './CoursesScreen';
import { HomeScreen } from './HomeScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { SplashScreen } from './SplashScreen';

export function PublicNavigator({ onOpenAdmin, onOpenStudentPortal, onOpenTeacher }) {
  // Flow states: 'splash' | 'onboarding' | 'main'
  const [flowState, setFlowState] = useState('main');

  // Main navigation tabs: 'home' | 'courses' | 'about' | 'contact'
  const [activeTab, setActiveTab] = useState('home');

  // Course Details State (when user clicks "View Details" on a course)
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Enquiry Modal State
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryCourseTitle, setEnquiryCourseTitle] = useState('3D Animation Masterclass');

  // Trigger enquiry modal with specific course
  const handleOpenEnquiry = (courseTitle = '3D Animation Masterclass') => {
    setEnquiryCourseTitle(courseTitle);
    setEnquiryModalVisible(true);
  };

  // Open course details
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
  };

  // Go to courses tab directly (from hero CTA)
  const handleExploreCourses = () => {
    setSelectedCourse(null);
    setActiveTab('courses');
  };

  // 1. SPLASH SCREEN
  if (flowState === 'splash') {
    return <SplashScreen onFinish={() => setFlowState('onboarding')} />;
  }

  // 2. ONBOARDING SCREEN
  if (flowState === 'onboarding') {
    return <OnboardingScreen onFinish={() => setFlowState('main')} />;
  }

  // 3. MAIN PUBLIC EXPERIENCE (HOME, COURSES, COURSE DETAILS, ABOUT, CONTACT)
  return (
    <View style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => {
            setSelectedCourse(null);
            setActiveTab('home');
          }}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>M</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>MORPHY ACADEMY</Text>
            <Text style={styles.brandSub}>STUDIO & CREATIVE TECH INSTITUTE</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.enquireNavBtn}
            onPress={() => handleOpenEnquiry('General Counseling')}
          >
            <Text style={styles.enquireNavBtnText}>Enquire</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.teacherNavBtn} onPress={onOpenTeacher}>
            <Text style={styles.teacherNavBtnText}>Faculty ↗</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.studentNavBtn} onPress={onOpenStudentPortal}>
            <Text style={styles.studentNavBtnText}>Student ↗</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminNavBtn} onPress={onOpenAdmin}>
            <Text style={styles.adminNavBtnText}>HR Portal ↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.contentArea}>
        {selectedCourse ? (
          <CourseDetailsScreen
            course={selectedCourse}
            onBack={() => setSelectedCourse(null)}
            onEnquire={(cTitle) => handleOpenEnquiry(cTitle)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                onExploreCourses={handleExploreCourses}
                onSelectCourse={handleSelectCourse}
                onEnquireCourse={handleOpenEnquiry}
                onOpenAdmin={onOpenAdmin}
                onOpenStudentPortal={onOpenStudentPortal}
              />
            )}

            {activeTab === 'courses' && (
              <CoursesScreen
                onSelectCourse={handleSelectCourse}
                onEnquireCourse={handleOpenEnquiry}
              />
            )}

            {activeTab === 'about' && (
              <AboutFacilitiesScreen onEnquire={handleOpenEnquiry} />
            )}

            {activeTab === 'contact' && (
              <ContactScreen onEnquire={handleOpenEnquiry} />
            )}
          </>
        )}
      </View>

      {/* Bottom Public Navigation Bar */}
      <View style={styles.bottomTabBar}>
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'courses', label: 'Courses', icon: '📚' },
          { id: 'about', label: 'About & Labs', icon: '🏢' },
          { id: 'contact', label: 'Contact', icon: '📞' },
        ].map((tab) => {
          const isActive = activeTab === tab.id && !selectedCourse;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => {
                setSelectedCourse(null);
                setActiveTab(tab.id);
              }}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global Enquiry Modal */}
      <EnquiryModal
        visible={enquiryModalVisible}
        defaultCourse={enquiryCourseTitle}
        onClose={() => setEnquiryModalVisible(false)}
      />
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceGlass,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: theme.colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  enquireNavBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
  },
  enquireNavBtnText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  teacherNavBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  teacherNavBtnText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  studentNavBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  studentNavBtnText: {
    color: theme.colors.accentSlate,
    fontSize: 11,
    fontWeight: '700',
  },
  adminNavBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  adminNavBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  tabItemActive: {
    backgroundColor: theme.colors.surface,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.7,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
});

