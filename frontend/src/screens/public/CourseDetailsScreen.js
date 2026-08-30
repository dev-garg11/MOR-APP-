import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { courseEndpoints } from '../../services/endpoints';
import { theme } from '../../theme';

export function CourseDetailsScreen({ course, onBack, onEnquire }) {
  const [courseData, setCourseData] = useState(course);
  const [openModuleIndex, setOpenModuleIndex] = useState(0);

  useEffect(() => {
    if (course && (course.slug || course.id)) {
      setCourseData(course);
      courseEndpoints
        .getPublicCourseDetail(course.slug || course.id)
        .then((res) => {
          if (res.data) setCourseData(res.data);
        })
        .catch((_err) => {
          // Keep current prop data
        });
    }
  }, [course]);

  if (!courseData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No course selected.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Courses</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = courseData.title || courseData.name;
  const image = courseData.image || courseData.thumbnail;
  const price = courseData.price || (courseData.fees ? `₹${Number(courseData.fees).toLocaleString()}` : 'Contact Admissions');
  const emi = courseData.emi || 'No-cost EMI available';
  const tag = courseData.tag || 'Professional Track';
  const tools = courseData.tools || [];
  const modules = courseData.modules || [];
  const outcomes = courseData.outcomes || [];
  const requirements = courseData.requirements || [];
  const careerRoles = courseData.careerRoles || courseData.career_roles || [];

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Bar with Back Button */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>← All Courses</Text>
          </TouchableOpacity>
          <Text style={styles.navCategory}>{courseData.category}</Text>
        </View>

        {/* Hero Course Cover Image */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Text style={{ fontSize: 40 }}>🎬</Text>
            </View>
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.tagBadge}>{tag}</Text>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroDuration}>⏱ Duration: {courseData.duration}</Text>
          </View>
        </View>

        {/* Quick Highlights Bar */}
        <View style={styles.highlightsBar}>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>TOTAL FEE</Text>
            <Text style={styles.highlightValue}>{price}</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>NO-COST EMI</Text>
            <Text style={[styles.highlightValue, { color: theme.colors.primary }]}>
              {emi}
            </Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>LEVEL</Text>
            <Text style={styles.highlightValue}>{courseData.level || 'All Levels'}</Text>
          </View>
        </View>

        {/* 1. Course Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Program Overview</Text>
          <Text style={styles.sectionBody}>
            {courseData.fullDesc || courseData.full_desc || courseData.shortDesc || courseData.short_desc}
          </Text>

          {/* Software Tools */}
          {tools.length > 0 ? (
            <>
              <Text style={styles.subSectionTitle}>Industry Tools & Software</Text>
              <View style={styles.toolsGrid}>
                {tools.map((t, idx) => (
                  <View key={idx} style={styles.toolPill}>
                    <Text style={styles.toolPillText}>🛠 {t}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* 2. Course Modules (Interactive Syllabus Accordion) */}
        {modules.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Curriculum & Syllabus Modules</Text>
            <Text style={styles.sectionSub}>
              Hands-on practical training from foundational principles to portfolio showreels.
            </Text>

            <View style={styles.moduleList}>
              {modules.map((m, idx) => {
                const isOpen = openModuleIndex === idx;
                const moduleNum = m.moduleNumber || String(idx + 1).padStart(2, '0');
                const lessons = m.lessons || [];
                const topics = m.topics || [];

                return (
                  <TouchableOpacity
                    key={m.id || moduleNum}
                    style={[styles.moduleCard, isOpen && styles.moduleCardOpen]}
                    onPress={() => setOpenModuleIndex(isOpen ? -1 : idx)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.moduleHeader}>
                      <View style={styles.moduleHeaderLeft}>
                        <Text style={styles.moduleNum}>MODULE {moduleNum}</Text>
                        <Text style={styles.moduleTitle}>{m.title}</Text>
                      </View>
                      <Text style={styles.moduleToggle}>{isOpen ? '▲' : '▼'}</Text>
                    </View>

                    {isOpen ? (
                      <View style={styles.topicList}>
                        {lessons.length > 0 ? (
                          lessons.map((les, lIdx) => (
                            <View key={les.id || lIdx} style={styles.topicRow}>
                              <Text style={styles.topicBullet}>▶</Text>
                              <Text style={styles.topicText}>{les.title}</Text>
                              {les.duration ? (
                                <Text style={styles.lessonDurationBadge}>{les.duration}</Text>
                              ) : null}
                            </View>
                          ))
                        ) : topics.length > 0 ? (
                          topics.map((t, tIdx) => (
                            <View key={tIdx} style={styles.topicRow}>
                              <Text style={styles.topicBullet}>•</Text>
                              <Text style={styles.topicText}>{t}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noLessonsText}>Comprehensive studio practicals included.</Text>
                        )}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* 3. What Students Will Learn */}
        {outcomes.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>What You Will Master</Text>
            <View style={styles.outcomesList}>
              {outcomes.map((item, idx) => (
                <View key={idx} style={styles.outcomeRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.outcomeText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 4. Requirements & Prerequisites */}
        {requirements.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Requirements & Eligibility</Text>
            <View style={styles.reqList}>
              {requirements.map((req, idx) => (
                <View key={idx} style={styles.reqRow}>
                  <Text style={styles.reqDot}>◈</Text>
                  <Text style={styles.reqText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 5. Career Opportunities & Compensation */}
        {careerRoles.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Career Opportunities</Text>
            <Text style={styles.sectionSub}>Target job profiles and compensation potential:</Text>
            <View style={styles.careersGrid}>
              {careerRoles.map((c, idx) => (
                <View key={idx} style={styles.careerPill}>
                  <Text style={styles.careerRoleText}>{c.role}</Text>
                  <Text style={styles.careerSalaryText}>{c.avgSalary}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.stickyFooter}>
        <View>
          <Text style={styles.stickyPrice}>{price}</Text>
          <Text style={styles.stickyEmi}>{emi}</Text>
        </View>

        <TouchableOpacity
          style={styles.stickyEnquireBtn}
          onPress={() => onEnquire(title, courseData.id)}
        >
          <Text style={styles.stickyEnquireText}>Enquire Now ➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  navCategory: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    height: 220,
    position: 'relative',
    backgroundColor: theme.colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0c0f17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(9, 12, 16, 0.85)',
  },
  tagBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  heroDuration: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  highlightsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
  },
  highlightLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  highlightValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  highlightDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
  },
  sectionCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 18,
  },
  sectionBody: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  subSectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolPill: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  toolPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  moduleList: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  moduleCardOpen: {
    borderColor: theme.colors.primary,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  moduleHeaderLeft: {
    flex: 1,
  },
  moduleNum: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  moduleTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  moduleToggle: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '900',
    paddingLeft: 8,
  },
  topicList: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicBullet: {
    color: theme.colors.primary,
    fontSize: 10,
    marginRight: 8,
  },
  topicText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  lessonDurationBadge: {
    color: theme.colors.textMuted,
    fontSize: 10,
    backgroundColor: '#0c0f17',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noLessonsText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  outcomesList: {
    gap: 10,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
    marginTop: 1,
  },
  outcomeText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  reqList: {
    gap: 8,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reqDot: {
    color: theme.colors.primary,
    fontSize: 12,
    marginRight: 8,
  },
  reqText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  careersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careerPill: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
  },
  careerRoleText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  careerSalaryText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickyPrice: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  stickyEmi: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  stickyEnquireBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    ...theme.shadows.glowPrimary,
  },
  stickyEnquireText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.xs,
  },
  backButtonText: {
    color: theme.colors.textDark,
    fontWeight: '800',
  },
});
