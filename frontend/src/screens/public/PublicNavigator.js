import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  // Flow states: 'splash' | 'onboarding' | 'main'
  const [flowState, setFlowState] = useState('splash');

  // Main navigation tabs: 'home' | 'courses' | 'about' | 'contact'
  const [activeTab, setActiveTab] = useState('home');

  // Course Details State (when user clicks "View Details" on a course)
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Side Drawer Menu State
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

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
      <StatusBar barStyle="light-content" backgroundColor="#0A0E17" translucent={false} />

      {/* Top Studio Navbar */}
      <View style={styles.navbarContainer}>
        <View style={styles.brandRow}>
          {/* Left: Side Menu / Home Navigation Button */}
          <TouchableOpacity
            style={styles.menuNavBtn}
            onPress={() => setSideMenuVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuNavIcon}>☰</Text>
            <Text style={styles.menuNavLabel}>Menu</Text>
          </TouchableOpacity>

          {/* Center: Brand Logo & Title */}
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

          {/* Right: Enquire CTA */}
          <TouchableOpacity
            style={styles.enquireNavBtn}
            onPress={() => handleOpenEnquiry('General Counseling')}
            activeOpacity={0.8}
          >
            <Text style={styles.enquireNavBtnText}>⚡ Enquire</Text>
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
          style={styles.tabItem}
          onPress={() => setSideMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>☰</Text>
          <Text style={[styles.tabLabel, { color: '#F5A623', fontWeight: '800' }]}>Portals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setAiChatVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, { color: '#10B981', fontWeight: '800' }]}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      {/* Floating AI Counselor Button */}
      {!aiChatVisible && (
        <TouchableOpacity
          style={styles.floatingAiBtn}
          onPress={() => setAiChatVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingAiIcon}>🤖</Text>
          <Text style={styles.floatingAiText}>Ask AI</Text>
        </TouchableOpacity>
      )}

      {/* Side Navigation Menu Drawer Modal */}
      <Modal
        visible={sideMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSideMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setSideMenuVisible(false)}
        >
          <View style={styles.drawerCard} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <View style={styles.logoBadgeSmall}>
                  <Text style={styles.logoBadgeTextSmall}>M</Text>
                </View>
                <View>
                  <Text style={styles.drawerBrandTitle}>MORPH ACADEMY</Text>
                  <Text style={styles.drawerBrandSub}>Studio Navigation</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.drawerCloseBtn}
                onPress={() => setSideMenuVisible(false)}
              >
                <Text style={styles.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScroll}>
              <Text style={styles.drawerSectionLabel}>QUICK ACCESS</Text>

              {/* 1. Home */}
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setSideMenuVisible(false);
                  setSelectedCourse(null);
                  setActiveTab('home');
                }}
              >
                <Text style={styles.drawerItemIcon}>🏠</Text>
                <View style={styles.drawerItemTextWrap}>
                  <Text style={styles.drawerItemTitle}>Home</Text>
                  <Text style={styles.drawerItemSub}>Main showcase & admissions</Text>
                </View>
                <Text style={styles.drawerArrow}>➔</Text>
              </TouchableOpacity>

              {/* 2. Courses */}
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setSideMenuVisible(false);
                  setSelectedCourse(null);
                  setActiveTab('courses');
                }}
              >
                <Text style={styles.drawerItemIcon}>📚</Text>
                <View style={styles.drawerItemTextWrap}>
                  <Text style={styles.drawerItemTitle}>Courses</Text>
                  <Text style={styles.drawerItemSub}>Animation, VFX, Gaming & Design</Text>
                </View>
                <Text style={styles.drawerArrow}>➔</Text>
              </TouchableOpacity>

              {/* 3. Student Portal */}
              <TouchableOpacity
                style={[styles.drawerItem, styles.drawerItemStudent]}
                onPress={() => {
                  setSideMenuVisible(false);
                  onOpenStudentPortal();
                }}
              >
                <Text style={styles.drawerItemIcon}>🎓</Text>
                <View style={styles.drawerItemTextWrap}>
                  <Text style={[styles.drawerItemTitle, { color: '#38BDF8' }]}>Student Portal</Text>
                  <Text style={styles.drawerItemSub}>Check attendance, fees, EMI & assignments</Text>
                </View>
                <Text style={[styles.drawerArrow, { color: '#38BDF8' }]}>➔</Text>
              </TouchableOpacity>

              {/* 4. Faculty & Trainer Portal */}
              <TouchableOpacity
                style={[styles.drawerItem, styles.drawerItemTeacher]}
                onPress={() => {
                  setSideMenuVisible(false);
                  onOpenTeacher();
                }}
              >
                <Text style={styles.drawerItemIcon}>🧑‍🏫</Text>
                <View style={styles.drawerItemTextWrap}>
                  <Text style={[styles.drawerItemTitle, { color: '#A78BFA' }]}>Faculty & Trainer Portal</Text>
                  <Text style={styles.drawerItemSub}>Batch logs, submissions & timetable</Text>
                </View>
                <Text style={[styles.drawerArrow, { color: '#A78BFA' }]}>➔</Text>
              </TouchableOpacity>

              {/* 5. HR & Admissions Desk */}
              <TouchableOpacity
                style={[styles.drawerItem, styles.drawerItemAdmin]}
                onPress={() => {
                  setSideMenuVisible(false);
                  onOpenAdmin();
                }}
              >
                <Text style={styles.drawerItemIcon}>🏢</Text>
                <View style={styles.drawerItemTextWrap}>
                  <Text style={[styles.drawerItemTitle, { color: '#F5A623' }]}>HR & Admissions Desk</Text>
                  <Text style={styles.drawerItemSub}>Leads CRM, admissions & fee manager</Text>
                </View>
                <Text style={[styles.drawerArrow, { color: '#F5A623' }]}>➔</Text>
              </TouchableOpacity>

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={styles.drawerCtaBtn}
                onPress={() => {
                  setSideMenuVisible(false);
                  handleOpenEnquiry('General Counseling');
                }}
              >
                <Text style={styles.drawerCtaBtnText}>⚡ Book Free Demo & Counseling</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
    backgroundColor: '#0A0E17',
    width: '100%',
  },
  navbarContainer: {
    backgroundColor: 'rgba(10, 14, 23, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuNavIcon: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '900',
  },
  menuNavLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  brandTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  logoBadgeText: {
    color: '#0A0E17',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  brandSub: {
    color: '#F5A623',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  enquireNavBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 12,
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
  floatingAiBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 86 : 78,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F5A623',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 24,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  floatingAiIcon: {
    fontSize: 18,
  },
  floatingAiText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Side Menu Drawer Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  drawerCard: {
    width: '84%',
    maxWidth: 360,
    height: '100%',
    backgroundColor: '#0B111E',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 16,
  },
  drawerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeTextSmall: {
    color: '#0A0E17',
    fontSize: 18,
    fontWeight: '900',
  },
  drawerBrandTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  drawerBrandSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerSectionLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#131D2E',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 10,
  },
  drawerItemStudent: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  drawerItemTeacher: {
    borderColor: 'rgba(167, 139, 250, 0.3)',
    backgroundColor: 'rgba(167, 139, 250, 0.06)',
  },
  drawerItemAdmin: {
    borderColor: 'rgba(245, 166, 35, 0.3)',
    backgroundColor: 'rgba(245, 166, 35, 0.06)',
  },
  drawerItemIcon: {
    fontSize: 22,
  },
  drawerItemTextWrap: {
    flex: 1,
  },
  drawerItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  drawerItemSub: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 2,
  },
  drawerArrow: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 14,
  },
  drawerCtaBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  drawerCtaBtnText: {
    color: '#0A0E17',
    fontSize: 12,
    fontWeight: '900',
  },
});

