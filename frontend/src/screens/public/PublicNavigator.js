import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EnquiryModal } from '../../components/public/EnquiryModal';
import { MORPH_COURSES } from '../../data/coursesData';
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
  const [flowState, setFlowState] = useState('splash');

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

  // 1. SPLASH SCREEN (Animated studio intro)
  if (flowState === 'splash') {
    return <SplashScreen onFinish={() => setFlowState('main')} />;
  }

  // 2. ONBOARDING SCREEN
  if (flowState === 'onboarding') {
    return <OnboardingScreen onFinish={() => setFlowState('main')} />;
  }

  // 3. MAIN PUBLIC EXPERIENCE (HOME, COURSES, COURSE DETAILS, ABOUT, CONTACT)
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E17" translucent={false} />

      {/* Top Studio Navbar (Notch & Status-bar Safe) */}
      <View style={styles.navbarContainer}>
        {/* Row 1: Brand Logo & Title */}
        <View style={styles.brandRow}>
          <TouchableOpacity
            style={styles.brandTouchable}
            activeOpacity={0.8}
            onPress={() => {
              setSelectedCourse(null);
              setActiveTab('home');
            }}
          >
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>M</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>MORPH ACADEMY</Text>
              <Text style={styles.brandSub}>STUDIO & CREATIVE TECH INSTITUTE</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.enquireNavBtn}
            onPress={() => handleOpenEnquiry('General Counseling')}
            activeOpacity={0.8}
          >
            <Text style={styles.enquireNavBtnText}>⚡ Enquire</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Portal Quick Access Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portalChipsRow}
        >
          <TouchableOpacity
            style={styles.teacherNavBtn}
            onPress={onOpenTeacher}
            activeOpacity={0.7}
          >
            <Text style={styles.teacherNavBtnText}>🧑‍🏫 Faculty ↗</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.studentNavBtn}
            onPress={onOpenStudentPortal}
            activeOpacity={0.7}
          >
            <Text style={styles.studentNavBtnText}>🎓 Student Portal ↗</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminNavBtn}
            onPress={onOpenAdmin}
            activeOpacity={0.7}
          >
            <Text style={styles.adminNavBtnText}>🏢 HR & Admissions ↗</Text>
          </TouchableOpacity>
        </ScrollView>
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

      {/* Bottom Floating Studio Dock */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && !selectedCourse && styles.tabItemActive]}
          onPress={() => {
            setSelectedCourse(null);
            setActiveTab('home');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'home' && !selectedCourse && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && !selectedCourse && styles.tabLabelActive]}>Home</Text>
          {activeTab === 'home' && !selectedCourse && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'courses' && !selectedCourse && styles.tabItemActive]}
          onPress={() => {
            setSelectedCourse(null);
            setActiveTab('courses');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'courses' && !selectedCourse && styles.tabIconActive]}>📚</Text>
          <Text style={[styles.tabLabel, activeTab === 'courses' && !selectedCourse && styles.tabLabelActive]}>Courses</Text>
          {activeTab === 'courses' && !selectedCourse && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'about' && styles.tabItemActive]}
          onPress={() => {
            setSelectedCourse(null);
            setActiveTab('about');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'about' && styles.tabIconActive]}>🏢</Text>
          <Text style={[styles.tabLabel, activeTab === 'about' && styles.tabLabelActive]}>About & Labs</Text>
          {activeTab === 'about' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'contact' && styles.tabItemActive]}
          onPress={() => {
            setSelectedCourse(null);
            setActiveTab('contact');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'contact' && styles.tabIconActive]}>📞</Text>
          <Text style={[styles.tabLabel, activeTab === 'contact' && styles.tabLabelActive]}>Contact</Text>
          {activeTab === 'contact' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Enquiry Modal */}
      <EnquiryModal
        visible={enquiryModalVisible}
        courseTitle={enquiryCourseTitle}
        onClose={() => setEnquiryModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E17',
    width: '100%',
  },
  navbarContainer: {
    backgroundColor: 'rgba(10, 14, 23, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logoBadgeText: {
    color: '#0A0E17',
    fontSize: 20,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSub: {
    color: '#F5A623',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  enquireNavBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  enquireNavBtnText: {
    color: '#0A0E17',
    fontSize: 12,
    fontWeight: '900',
  },
  portalChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  teacherNavBtn: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.35)',
  },
  teacherNavBtnText: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '700',
  },
  studentNavBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  studentNavBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  adminNavBtn: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  adminNavBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#F5A623',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5A623',
    marginTop: 2,
  },
});
