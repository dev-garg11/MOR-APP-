import React, { useEffect, useState, useCallback } from 'react';
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

export function TeacherCoursesScreen({ onOpenBatch }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [courseDetail, setCourseDetail] = useState(null);
  const [error, setError] = useState('');

  const loadCourses = useCallback(async () => {
    try {
      setError('');
      const res = await teacherEndpoints.getCourses();
      if (res.ok && res.data) {
        setCourses(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assigned courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const openCourseDetail = async (course) => {
    setSelectedCourse(course);
    setDetailLoading(true);
    setCourseDetail(null);
    try {
      const res = await teacherEndpoints.getCourseDetail(course.id);
      if (res.ok && res.data) {
        setCourseDetail(res.data);
      }
    } catch (err) {
      console.warn('Failed to load course detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.short_desc && c.short_desc.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assigned courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Assigned Courses</Text>
        <Text style={styles.headerSub}>
          Courses and curriculum authorized for your mentorship ({courses.length} Assigned)
        </Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search assigned courses by title or subject..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Courses List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {filteredCourses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Assigned Courses Found</Text>
            <Text style={styles.emptySub}>
              {search
                ? 'No courses matched your search query.'
                : 'You are not assigned to any courses yet. Super Admin assigns faculty to curriculum tracks.'}
            </Text>
          </View>
        ) : (
          <View style={styles.courseList}>
            {filteredCourses.map((c) => (
              <View key={c.id} style={styles.courseCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{c.category.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.statusBadge}>🟢 ACTIVE</Text>
                </View>

                <Text style={styles.courseName}>{c.name}</Text>
                {c.short_desc ? <Text style={styles.courseDesc}>{c.short_desc}</Text> : null}

                <View style={styles.kpiRow}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiValue}>{c.modules_count}</Text>
                    <Text style={styles.kpiLabel}>Modules</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={[styles.kpiValue, { color: theme.colors.accentCyan }]}>
                      {c.batches_count}
                    </Text>
                    <Text style={styles.kpiLabel}>My Batches</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={[styles.kpiValue, { color: theme.colors.success }]}>
                      {c.students_count}
                    </Text>
                    <Text style={styles.kpiLabel}>Students</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={[styles.kpiValue, { color: theme.colors.accentPurple }]}>
                      {c.duration}
                    </Text>
                    <Text style={styles.kpiLabel}>Duration</Text>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.syllabusBtn}
                    onPress={() => openCourseDetail(c)}
                  >
                    <Text style={styles.syllabusBtnText}>📖 View Full Syllabus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* SYLLABUS & LESSONS MODAL */}
      <Modal visible={Boolean(selectedCourse)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedCourse?.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedCourse?.category} • {selectedCourse?.duration} • Level:{' '}
                  {selectedCourse?.level}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedCourse(null)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {detailLoading ? (
                <View style={styles.modalCenterBox}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading curriculum modules & lessons...</Text>
                </View>
              ) : (
                <>
                  {/* Assigned Batches Section in Modal */}
                  <Text style={styles.modalSectionTitle}>👥 My Batches Under This Course</Text>
                  {courseDetail?.batches?.length === 0 ? (
                    <Text style={styles.noBatchesText}>No batches currently created for this course.</Text>
                  ) : (
                    <View style={styles.modalBatchesList}>
                      {courseDetail?.batches?.map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          style={styles.modalBatchItem}
                          onPress={() => {
                            setSelectedCourse(null);
                            onOpenBatch(b.id);
                          }}
                        >
                          <View>
                            <Text style={styles.modalBatchName}>{b.name}</Text>
                            <Text style={styles.modalBatchMeta}>
                              ⏰ {b.timing} • 👥 {b.students_count} Students
                            </Text>
                          </View>
                          <Text style={styles.openBatchText}>Open Batch ➔</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Modules & Syllabus */}
                  <Text style={styles.modalSectionTitle}>📚 Course Syllabus & Modules</Text>
                  {courseDetail?.modules?.length === 0 ? (
                    <Text style={styles.noBatchesText}>No modules published for this course yet.</Text>
                  ) : (
                    <View style={styles.modulesList}>
                      {courseDetail?.modules?.map((m, idx) => (
                        <View key={m.id || String(idx)} style={styles.moduleCard}>
                          <View style={styles.moduleHeader}>
                            <View style={styles.moduleNumBadge}>
                              <Text style={styles.moduleNumText}>{idx + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.moduleTitle}>{m.title}</Text>
                              {m.description ? (
                                <Text style={styles.moduleDesc}>{m.description}</Text>
                              ) : null}
                            </View>
                          </View>

                          {m.lessons?.length > 0 ? (
                            <View style={styles.lessonsList}>
                              {m.lessons.map((l, lIdx) => (
                                <View key={l.id || String(lIdx)} style={styles.lessonItem}>
                                  <Text style={styles.lessonDot}>•</Text>
                                  <Text style={styles.lessonTitle}>{l.title}</Text>
                                  {l.duration ? (
                                    <Text style={styles.lessonDuration}>({l.duration})</Text>
                                  ) : null}
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceCard,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  courseList: {
    gap: 14,
  },
  courseCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  courseName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  courseDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xs,
    padding: 10,
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiValue: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  kpiLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
  },
  syllabusBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  syllabusBtnText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 18,
  },
  modalCenterBox: {
    padding: 30,
    alignItems: 'center',
  },
  modalSectionTitle: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 10,
  },
  noBatchesText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 14,
  },
  modalBatchesList: {
    gap: 8,
    marginBottom: 16,
  },
  modalBatchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBatchName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBatchMeta: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  openBatchText: {
    color: theme.colors.accentSlate,
    fontSize: 11,
    fontWeight: '700',
  },
  modulesList: {
    gap: 10,
    marginBottom: 20,
  },
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  moduleNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleNumText: {
    color: theme.colors.textDark,
    fontSize: 11,
    fontWeight: '900',
  },
  moduleTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  moduleDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  lessonsList: {
    marginTop: 8,
    paddingLeft: 32,
    gap: 4,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonDot: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  lessonTitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  lessonDuration: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
});

