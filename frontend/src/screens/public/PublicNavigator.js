import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { EnquiryModal } from '../../components/public/EnquiryModal';
import { AiCounselorChatModal } from '../../components/public/AiCounselorChatModal';
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Flow states: 'splash' | 'onboarding' | 'main'
  const [flowState, setFlowState] = useState('splash');

  // Main navigation tabs: 'home' | 'courses' | 'about' | 'contact'
  const [activeTab, setActiveTab] = useState('home');

  // Course Details State (when user clicks "View Details" on a course)
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Enquiry Modal State
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryCourseTitle, setEnquiryCourseTitle] = useState('3D Animation Masterclass');

  // AI Counselor Chat Modal State
  const [aiChatVisible, setAiChatVisible] = useState(false);

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
      <StatusBar barStyle="light-content" backgroundColor="#080B10" translucent={false} />

      {/* Top Studio Header */}
      <View style={styles.navbarContainer}>
        <View style={[styles.navbarInner, isDesktop && styles.navbarInnerDesktop]}>
          {/* Brand Logo & Title */}
          <TouchableOpacity
            style={styles.brandTouchable}
            activeOpacity={0.85}
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
              <Text style={styles.brandSub}>CREATIVE TECH & ANIMATION STUDIO</Text>
            </View>
          </TouchableOpacity>

          {/* Desktop Nav Links */}
          {isDesktop && (
            <View style={styles.desktopNavLinks}>
              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'home' && !selectedCourse && styles.desktopNavLinkActive]}
                onPress={() => {
                  setSelectedCourse(null);
                  setActiveTab('home');
                }}
              >
                <Text style={[styles.desktopNavLinkText, activeTab === 'home' && !selectedCourse && styles.desktopNavLinkTextActive]}>Home</Text>
                {activeTab === 'home' && !selectedCourse && <View style={styles.desktopNavIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'courses' && !selectedCourse && styles.desktopNavLinkActive]}
                onPress={() => {
                  setSelectedCourse(null);
                  setActiveTab('courses');
                }}
              >
                <Text style={[styles.desktopNavLinkText, activeTab === 'courses' && !selectedCourse && styles.desktopNavLinkTextActive]}>Courses</Text>
                {activeTab === 'courses' && !selectedCourse && <View style={styles.desktopNavIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'about' && styles.desktopNavLinkActive]}
                onPress={() => {
                  setSelectedCourse(null);
                  setActiveTab('about');
                }}
              >
                <Text style={[styles.desktopNavLinkText, activeTab === 'about' && styles.desktopNavLinkTextActive]}>About & Labs</Text>
                {activeTab === 'about' && <View style={styles.desktopNavIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'contact' && styles.desktopNavLinkActive]}
                onPress={() => {
                  setSelectedCourse(null);
                  setActiveTab('contact');
                }}
              >
                <Text style={[styles.desktopNavLinkText, activeTab === 'contact' && styles.desktopNavLinkTextActive]}>Contact</Text>
                {activeTab === 'contact' && <View style={styles.desktopNavIndicator} />}
              </TouchableOpacity>
            </View>
          )}

          {/* Action Row */}
          <View style={styles.navActionsRow}>
            <TouchableOpacity
              style={styles.studentNavBtn}
              onPress={onOpenStudentPortal}
              activeOpacity={0.8}
            >
              <Text style={styles.studentNavBtnText}>🎓 Portal</Text>
            </TouchableOpacity>

            {isDesktop && (
              <>
                <TouchableOpacity
                  style={styles.teacherNavBtn}
                  onPress={onOpenTeacher}
                  activeOpacity={0.8}
                >
                  <Text style={styles.teacherNavBtnText}>🧑‍🏫 Faculty</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.adminNavBtn}
                  onPress={onOpenAdmin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adminNavBtnText}>🏢 HR</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.enquireNavBtn}
              onPress={() => handleOpenEnquiry('General Counseling')}
              activeOpacity={0.85}
            >
              <Text style={styles.enquireNavBtnText}>⚡ Book Demo</Text>
            </TouchableOpacity>
          </View>
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

      {/* Bottom Floating Studio Dock (Mobile Only) */}
      {!isDesktop && (
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
            <Text style={[styles.tabIcon, activeTab === 'about' && styles.tabIconActive]}>🏛️</Text>
            <Text style={[styles.tabLabel, activeTab === 'about' && styles.tabLabelActive]}>Labs</Text>
            {activeTab === 'about' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={onOpenStudentPortal}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>🎓</Text>
            <Text style={[styles.tabLabel, { color: '#38BDF8', fontWeight: '800' }]}>Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setAiChatVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>💬</Text>
            <Text style={[styles.tabLabel, { color: '#F5A623', fontWeight: '800' }]}>Ask AI</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating AI Counselor Button */}
      {!aiChatVisible && (
        <TouchableOpacity
          style={styles.floatingAiBtn}
          onPress={() => setAiChatVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.floatingAiPulse} />
          <Text style={styles.floatingAiIcon}>✨</Text>
          <Text style={styles.floatingAiText}>AI Counselor</Text>
        </TouchableOpacity>
      )}

      {/* AI Counselor Chat Modal */}
      <AiCounselorChatModal
        visible={aiChatVisible}
        onClose={() => setAiChatVisible(false)}
        onOpenEnquiry={(cTitle) => {
          setAiChatVisible(false);
          handleOpenEnquiry(cTitle);
        }}
      />

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
    backgroundColor: '#080B10',
    width: '100%',
  },
  navbarContainer: {
    backgroundColor: 'rgba(8, 11, 16, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  navbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  navbarInnerDesktop: {
    maxWidth: 1240,
    marginHorizontal: 'auto',
    width: '100%',
    flexWrap: 'nowrap',
    paddingHorizontal: 8,
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logoBadgeText: {
    color: '#080B10',
    fontSize: 20,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#F8FAFC',
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
  desktopNavLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginHorizontal: 16,
  },
  desktopNavLink: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: 'relative',
  },
  desktopNavLinkActive: {},
  desktopNavLinkText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  desktopNavLinkTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  desktopNavIndicator: {
    position: 'absolute',
    bottom: -6,
    left: 8,
    right: 8,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#F5A623',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  navActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teacherNavBtn: {
    backgroundColor: 'rgba(245, 166, 35, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.30)',
  },
  teacherNavBtnText: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '700',
  },
  studentNavBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
  },
  studentNavBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  adminNavBtn: {
    backgroundColor: 'rgba(148, 163, 184, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  adminNavBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  enquireNavBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  enquireNavBtnText: {
    color: '#080B10',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  contentArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
  floatingAiBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 86 : 78,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D1117',
    borderWidth: 1.5,
    borderColor: '#F5A623',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  floatingAiPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  floatingAiIcon: {
    fontSize: 16,
  },
  floatingAiText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

