import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ACADEMY_FACILITIES,
  ACADEMY_FACULTY,
  MORPHY_COURSES,
} from '../../data/coursesData';
import { theme } from '../../theme';
import { detectAndPersistLeadSource } from '../../utils/leadSourceDetector';

// Verified 200 OK CDN studio assets
const ASSETS = {
  character3D: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
  vfxCinematic: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
  unrealGame: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
  motionArt: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
  studioLab: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
};

const HERO_SHOWCASE_ITEMS = [
  {
    id: '3d-anim',
    courseName: '3D Character Animation & Rigging',
    tag: 'STUDIO SHOWCASE 01',
    software: 'Autodesk Maya • ZBrush • Blender',
    image: ASSETS.character3D,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    badge: '3D CHARACTER',
    icon: '🎬',
  },
  {
    id: 'vfx-comp',
    courseName: 'Cinematic VFX & Green-Screen Compositing',
    tag: 'STUDIO SHOWCASE 02',
    software: 'Foundry Nuke • After Effects • Houdini',
    image: ASSETS.vfxCinematic,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    badge: 'VFX & CGI',
    icon: '💥',
  },
  {
    id: 'ue5-game',
    courseName: 'Unreal Engine 5 Game Environment & UI',
    tag: 'STUDIO SHOWCASE 03',
    software: 'Unreal Engine 5 • Figma • Substance',
    image: ASSETS.unrealGame,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    badge: 'GAME DESIGN',
    icon: '🎮',
  },
  {
    id: 'motion-art',
    courseName: '3D Kinetic Motion & Brand Visuals',
    tag: 'STUDIO SHOWCASE 04',
    software: 'Cinema 4D • Octane • Illustrator',
    image: ASSETS.motionArt,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    badge: 'MOTION GRAPHICS',
    icon: '⚡',
  },
];

const PLACEMENT_STUDIOS = [
  'Ubisoft',
  'Framestore',
  'Rockstar Games',
  'MPC Film',
  'Technicolor',
  'Red Chillies VFX',
  'Maya Digital',
  'DNEG',
];

const FAQS = [
  {
    q: 'Do I need prior drawing or coding experience to join?',
    a: 'No prior background is required. Every program begins with foundational visual principles, software shortcuts, and step-by-step mentor guidance.',
  },
  {
    q: 'Are high-end workstations provided during training?',
    a: 'Yes, Morphy Academy provides dedicated workstations equipped with NVIDIA RTX GPUs, dual color-accurate monitors, and drawing tablets.',
  },
  {
    q: 'How does the 0% interest EMI payment plan work?',
    a: 'We offer flexible 3, 6, and 12-month installment plans with zero hidden charges. You can pay via UPI, Credit/Debit cards, or NetBanking.',
  },
  {
    q: 'Is 100% placement assistance provided after graduation?',
    a: 'Yes, our dedicated placement cell helps you polish your portfolio showreel, conducts mock studio interviews, and arranges direct placement drives.',
  },
];

export function HomeScreen({
  onExploreCourses,
  onSelectCourse,
  onEnquireCourse,
}) {
  const [selectedCurriculumCourse, setSelectedCurriculumCourse] = useState(MORPHY_COURSES[0]);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Dynamic Hero Video & Title Switcher Index
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [calcCourse, setCalcCourse] = useState(MORPHY_COURSES[0]);
  const [calcTenure, setCalcTenure] = useState(12);

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    detectAndPersistLeadSource();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 4,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setActiveShowcaseIndex((prev) => (prev + 1) % HERO_SHOWCASE_ITEMS.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [floatAnim]);

  useEffect(() => {
    fadeAnim.setValue(0.3);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeShowcaseIndex, fadeAnim]);

  const activeShowcase = HERO_SHOWCASE_ITEMS[activeShowcaseIndex];

  const handleWhatsApp = () => {
    Linking.openURL(
      'https://wa.me/919876543210?text=Hi%20Morphy%20Academy%20Team%2C%20I%20am%20interested%20in%20your%20creative%20tech%20courses.'
    );
  };

  const totalFee = calcCourse.priceNum;
  const monthlyEmi = Math.round(totalFee / calcTenure);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. HERO SECTION */}
      <View style={styles.heroSection}>
        <View style={styles.heroLeft}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>✦ ADMISSIONS OPEN • 2026-2027 BATCH</Text>
          </View>

          <Text style={styles.heroHeading}>
            Master 3D, VFX & Game Design.{`\n`}
            <Text style={{ color: theme.colors.primary }}>Craft Studio-Grade Showreels.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            Learn industry-standard production workflows in Animation, Visual Effects, Unreal Engine 5, and Motion Graphics with 1-on-1 studio mentors.
          </Text>

          {/* Primary CTAs: Explore Courses and Enquire Now */}
          <View style={styles.heroCtaRow}>
            <TouchableOpacity
              style={styles.primaryCtaBtn}
              onPress={() => (onEnquireCourse ? onEnquireCourse(activeShowcase.courseName) : null)}
            >
              <Text style={styles.primaryCtaText}>Enquire Now ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exploreCtaBtn}
              onPress={onExploreCourses}
            >
              <Text style={styles.exploreCtaText}>Explore All Courses 📚</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsAppCtaBtn} onPress={handleWhatsApp}>
              <Text style={styles.whatsAppCtaText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Metric Counters */}
          <View style={styles.trustBar}>
            <View style={styles.trustCol}>
              <Text style={styles.trustNumber}>12+ Yrs</Text>
              <Text style={styles.trustLabel}>Industry Legacy</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustCol}>
              <Text style={styles.trustNumber}>5,000+</Text>
              <Text style={styles.trustLabel}>Placed Graduates</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustCol}>
              <Text style={styles.trustNumber}>100%</Text>
              <Text style={styles.trustLabel}>Hands-on Projects</Text>
            </View>
          </View>
        </View>

        {/* Hero Right: Dual Visual Showcase */}
        <View style={styles.heroRightDual}>
          <Animated.View
            style={[
              styles.showcaseMainCard,
              { transform: [{ translateY: floatAnim }], opacity: fadeAnim },
            ]}
          >
            {/* Course Selector Tabs */}
            <View style={styles.showcaseTabsRow}>
              {HERO_SHOWCASE_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.showcaseTabBtn,
                    activeShowcaseIndex === idx && styles.showcaseTabBtnActive,
                  ]}
                  onPress={() => setActiveShowcaseIndex(idx)}
                >
                  <Text
                    style={[
                      styles.showcaseTabBtnText,
                      activeShowcaseIndex === idx && styles.showcaseTabBtnTextActive,
                    ]}
                  >
                    {item.icon} {item.badge}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Video / Animated Visual Display */}
            <View style={styles.videoPlayerContainer}>
              {Platform.OS === 'web' ? (
                <video
                  key={activeShowcase.videoUrl}
                  src={activeShowcase.videoUrl}
                  poster={activeShowcase.image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 12,
                  }}
                />
              ) : (
                <Image source={{ uri: activeShowcase.image }} style={styles.showcaseImage} />
              )}

              <View style={styles.liveReelBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveReelText}>STUDIO REEL PREVIEW</Text>
              </View>
            </View>

            {/* Dynamic Course Info Bar */}
            <View style={styles.showcaseInfoFooter}>
              <View style={styles.showcaseInfoLeft}>
                <Text style={styles.dynamicCourseTag}>{activeShowcase.tag}</Text>
                <Text style={styles.dynamicCourseTitle}>{activeShowcase.courseName}</Text>
                <Text style={styles.dynamicSoftware}>🛠 {activeShowcase.software}</Text>
              </View>
              <TouchableOpacity
                style={styles.showcaseEnquireBtn}
                onPress={() => onEnquireCourse(activeShowcase.courseName)}
              >
                <Text style={styles.showcaseEnquireBtnText}>Apply ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Direct Official Social & Video Links */}
            <View style={styles.socialReelButtonsRow}>
              <TouchableOpacity
                style={styles.instagramReelBtn}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/reel/DZaS-wxyHRN/?igsi=MW80aGprY2Jlc2l2ZA=='
                  )
                }
              >
                <Text style={styles.instagramReelText}>📷 Watch on Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.youtubeReelBtn}
                onPress={() =>
                  Linking.openURL('https://youtu.be/LFzsiom456g?si=-GiUXASfSS4vhyuM')
                }
              >
                <Text style={styles.youtubeReelText}>▶️ Watch on YouTube</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Secondary Picture Card */}
          <View style={styles.showcaseSecondaryCard}>
            <Image source={{ uri: ASSETS.studioLab }} style={styles.secondaryImage} />
            <View style={styles.secondaryOverlay}>
              <Text style={styles.secondaryBadge}>FACILITY & EQUIPMENT</Text>
              <Text style={styles.secondaryTitle}>RTX 4090 Workstations & 4K Lab</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. PLACEMENT PARTNERS */}
      <View style={styles.marqueeSection}>
        <Text style={styles.marqueeTitle}>STUDENTS HIRED BY TOP GLOBAL STUDIOS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marqueeRow}>
          {PLACEMENT_STUDIOS.map((studio) => (
            <View key={studio} style={styles.studioPill}>
              <Text style={styles.studioPillText}>★ {studio}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 3. FEATURED PROGRAMS */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionBadge}>INDUSTRY CURRICULUM</Text>
            <Text style={styles.sectionTitle}>Featured Academy Programs</Text>
          </View>
          <TouchableOpacity style={styles.viewAllBtn} onPress={onExploreCourses}>
            <Text style={styles.viewAllBtnText}>View All ({MORPHY_COURSES.length}) ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseGrid}>
          {MORPHY_COURSES.slice(0, 4).map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <Image source={{ uri: course.image }} style={styles.courseCardImage} />

              <View style={styles.courseCardBody}>
                <View style={styles.courseCardTop}>
                  <Text style={styles.courseTagBadge}>{course.tag}</Text>
                  <Text style={styles.courseDuration}>⏱ {course.duration}</Text>
                </View>

                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDesc}>{course.shortDesc}</Text>

                <View style={styles.toolsRow}>
                  {course.tools.map((tool) => (
                    <View key={tool} style={styles.toolPill}>
                      <Text style={styles.toolPillText}>{tool}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.courseBottom}>
                  <View>
                    <Text style={styles.priceValue}>{course.price}</Text>
                    <Text style={styles.emiValue}>EMI {course.emi}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => (onSelectCourse ? onSelectCourse(course) : null)}
                    >
                      <Text style={styles.detailsBtnText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.courseEnquireBtn}
                      onPress={() => onEnquireCourse(course.title)}
                    >
                      <Text style={styles.courseEnquireBtnText}>Enquire ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. WHY CHOOSE US (4-PILLAR GRID) */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionBadge}>ADVANTAGE</Text>
          <Text style={styles.sectionTitle}>Why Choose Morphy Academy?</Text>

          <View style={styles.whyGrid}>
            {[
              {
                icon: '🎬',
                title: 'Real Film & Game Projects',
                desc: 'Produce production-grade showreels evaluated by studio art directors.',
              },
              {
                icon: '⚡',
                title: 'NVIDIA RTX 4090 Workstations',
                desc: 'Dedicated high-end dual screen stations for every student.',
              },
              {
                icon: '👨‍🏫',
                title: '1-on-1 Studio Mentorship',
                desc: 'Mentors with 10+ years experience in Disney, Ubisoft & Framestore.',
              },
              {
                icon: '💳',
                title: '0% Interest No-Cost EMI',
                desc: 'Transparent monthly payment plans with zero hidden fees.',
              },
            ].map((item) => (
              <View key={item.title} style={styles.whyItem}>
                <Text style={styles.whyIcon}>{item.icon}</Text>
                <Text style={styles.whyTitle}>{item.title}</Text>
                <Text style={styles.whyDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 5. TRAINERS & FACULTY PREVIEW */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>FACULTY & MENTORS</Text>
          <Text style={styles.sectionTitle}>Learn from Senior Studio Leads</Text>
        </View>

        <View style={styles.facultyGrid}>
          {ACADEMY_FACULTY.map((faculty) => (
            <View key={faculty.name} style={styles.facultyCard}>
              <Image source={{ uri: faculty.avatar }} style={styles.facultyAvatar} />
              <Text style={styles.facultyName}>{faculty.name}</Text>
              <Text style={styles.facultyRole}>{faculty.role}</Text>
              <Text style={styles.facultyExp}>{faculty.experience}</Text>
              <Text style={styles.facultyTools}>🛠 {faculty.tools}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 6. FACILITIES SHOWCASE */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>CAMPUS & INFRASTRUCTURE</Text>
          <Text style={styles.sectionTitle}>Studio-Grade Facilities</Text>
        </View>

        <View style={styles.facilityGrid}>
          {ACADEMY_FACILITIES.map((f) => (
            <View key={f.title} style={styles.facilityCard}>
              <Text style={styles.facilityIcon}>{f.icon}</Text>
              <Text style={styles.facilityTitle}>{f.title}</Text>
              <Text style={styles.facilityDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 7. INTERACTIVE 0% INTEREST EMI CALCULATOR */}
      <View style={styles.sectionWrap}>
        <View style={styles.calculatorCard}>
          <View style={styles.calcLeft}>
            <Text style={styles.calcBadge}>FEE TRANSPARENCY</Text>
            <Text style={styles.calcHeading}>Interactive EMI & Fee Calculator</Text>
            <Text style={styles.calcSub}>
              Plan your learning budget with zero interest and transparent monthly installments.
            </Text>

            <Text style={styles.calcLabel}>1. Select Program</Text>
            <View style={styles.calcCourseSelect}>
              {MORPHY_COURSES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.calcCoursePill,
                    calcCourse.id === c.id && styles.calcCoursePillActive,
                  ]}
                  onPress={() => setCalcCourse(c)}
                >
                  <Text
                    style={[
                      styles.calcCoursePillText,
                      calcCourse.id === c.id && styles.calcCoursePillTextActive,
                    ]}
                  >
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.calcLabel}>2. Select Installment Tenure</Text>
            <View style={styles.tenureRow}>
              {[3, 6, 12].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.tenureBtn, calcTenure === m && styles.tenureBtnActive]}
                  onPress={() => setCalcTenure(m)}
                >
                  <Text
                    style={[
                      styles.tenureBtnText,
                      calcTenure === m && styles.tenureBtnTextActive,
                    ]}
                  >
                    {m} Months Plan
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.calcRight}>
            <Text style={styles.breakdownTitle}>ESTIMATED PAYMENT PLAN</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>Course:</Text>
              <Text style={styles.breakdownVal}>{calcCourse.title}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>Total Course Fee:</Text>
              <Text style={styles.breakdownVal}>₹{totalFee.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>Interest Rate:</Text>
              <Text style={[styles.breakdownVal, { color: theme.colors.success }]}>
                0% No-Cost EMI
              </Text>
            </View>

            <View style={styles.calcResultBox}>
              <Text style={styles.calcResultLabel}>MONTHLY INSTALLMENT</Text>
              <Text style={styles.calcResultAmount}>₹{monthlyEmi.toLocaleString()}</Text>
              <Text style={styles.calcResultTenure}>for {calcTenure} months</Text>
            </View>

            <TouchableOpacity
              style={styles.calcApplyBtn}
              onPress={() => onEnquireCourse(`${calcCourse.title} (${calcTenure}M EMI)`)}
            >
              <Text style={styles.calcApplyBtnText}>Apply with this EMI Plan ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBadge}>FAQ & ADMISSIONS</Text>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>

        <View style={styles.faqList}>
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <TouchableOpacity
                key={faq.q}
                style={[styles.faqItem, isOpen && styles.faqItemOpen]}
                onPress={() => setOpenFaqIndex(isOpen ? -1 : index)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHead}>
                  <Text style={styles.faqQ}>{faq.q}</Text>
                  <Text style={styles.faqToggle}>{isOpen ? '−' : '+'}</Text>
                </View>
                {isOpen ? <Text style={styles.faqA}>{faq.a}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 9. BOTTOM CTA BANNER */}
      <View style={styles.bottomBanner}>
        <Text style={styles.bottomBannerBadge}>TAKE THE NEXT STEP</Text>
        <Text style={styles.bottomBannerTitle}>Ready to launch your creative career?</Text>
        <Text style={styles.bottomBannerSub}>
          Connect with our senior faculty for a personalized curriculum walkthrough and lab demo.
        </Text>
        <View style={styles.bannerBtnRow}>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => onEnquireCourse('General Counseling')}
          >
            <Text style={styles.bannerBtnText}>Book Free Counseling & Lab Demo ➔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bannerWaBtn} onPress={handleWhatsApp}>
            <Text style={styles.bannerWaBtnText}>💬 Chat on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2026 Morphy Academy. All rights reserved. • ISO Certified Animation & VFX Training
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 24,
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1.1,
    minWidth: 320,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeading: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 12,
  },
  heroDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 580,
  },
  heroCtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  primaryCtaBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: theme.radius.sm,
    ...theme.shadows.glowPrimary,
  },
  primaryCtaText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
  exploreCtaBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  exploreCtaText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  whatsAppCtaBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: theme.radius.sm,
  },
  whatsAppCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  trustBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    maxWidth: 480,
  },
  trustCol: {
    flex: 1,
    alignItems: 'center',
  },
  trustNumber: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  trustLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
  heroRightDual: {
    flex: 1.1,
    minWidth: 320,
    gap: 12,
  },
  showcaseMainCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  showcaseTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  showcaseTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  showcaseTabBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  showcaseTabBtnText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  showcaseTabBtnTextActive: {
    color: theme.colors.primary,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 190,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveReelBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 12, 16, 0.80)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.danger,
    marginRight: 6,
  },
  liveReelText: {
    color: theme.colors.textPrimary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  showcaseInfoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
  },
  showcaseInfoLeft: {
    flex: 1,
  },
  dynamicCourseTag: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dynamicCourseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  dynamicSoftware: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  showcaseEnquireBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
  },
  showcaseEnquireBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 11,
  },
  socialReelButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  instagramReelBtn: {
    flex: 1,
    backgroundColor: '#E1306C',
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  instagramReelText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
  },
  youtubeReelBtn: {
    flex: 1,
    backgroundColor: '#FF0000',
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
  },
  youtubeReelText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
  },
  showcaseSecondaryCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 12,
  },
  secondaryImage: {
    width: 70,
    height: 50,
    borderRadius: theme.radius.sm,
    resizeMode: 'cover',
  },
  secondaryOverlay: {
    flex: 1,
  },
  secondaryBadge: {
    color: theme.colors.accentSlate,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  secondaryTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  marqueeSection: {
    paddingVertical: 16,
    backgroundColor: theme.colors.surfaceCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  marqueeTitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 10,
  },
  marqueeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  studioPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  studioPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionWrap: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  viewAllBtn: {
    paddingVertical: 4,
  },
  viewAllBtnText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseCard: {
    flex: 1,
    minWidth: 270,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  courseCardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    backgroundColor: theme.colors.surface,
  },
  courseCardBody: {
    padding: 16,
  },
  courseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTagBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  courseDuration: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  courseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  courseDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  toolPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toolPillText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  courseBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  priceValue: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  emiValue: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  detailsBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailsBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  courseEnquireBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
  },
  courseEnquireBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  whyItem: {
    flex: 1,
    minWidth: 220,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  whyIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  whyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  whyDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  facultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  facultyCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: theme.colors.surfaceCard,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    textAlign: 'center',
  },
  facultyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
  },
  facultyName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  facultyRole: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  facultyExp: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  facultyTools: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  facilityCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: theme.colors.surfaceCard,
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  facilityIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  facilityTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  facilityDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  calculatorCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 24,
    ...theme.shadows.md,
  },
  calcLeft: {
    flex: 1.2,
    minWidth: 280,
  },
  calcBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  calcHeading: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  calcSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  calcLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  calcCourseSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  calcCoursePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calcCoursePillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  calcCoursePillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  calcCoursePillTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  tenureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tenureBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  tenureBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tenureBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tenureBtnTextActive: {
    color: theme.colors.textDark,
    fontWeight: '800',
  },
  calcRight: {
    flex: 1,
    minWidth: 260,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  breakdownTitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  breakdownKey: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  breakdownVal: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  calcResultBox: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.sm,
    padding: 14,
    marginTop: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calcResultLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calcResultAmount: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 2,
  },
  calcResultTenure: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  calcApplyBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
    ...theme.shadows.glowPrimary,
  },
  calcApplyBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  faqItemOpen: {
    borderColor: theme.colors.borderLight,
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  faqToggle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  faqA: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomBanner: {
    margin: 20,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    ...theme.shadows.md,
  },
  bottomBannerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  bottomBannerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomBannerSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 500,
  },
  bannerBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  bannerBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.xs,
    ...theme.shadows.glowPrimary,
  },
  bannerBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  bannerWaBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.radius.xs,
  },
  bannerWaBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
