import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CourseEditorModal } from '../../components/admin/CourseEditorModal';
import { courseEndpoints } from '../../services/endpoints';
import { theme } from '../../theme';

export function CourseManagementScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft' | 'unpublished'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Editor Modal State
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseEndpoints.listAdminCourses();
      setCourses(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load courses from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || c.category?.toLowerCase() === categoryFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.short_desc && c.short_desc.toLowerCase().includes(q));

      return matchStatus && matchCategory && matchSearch;
    });
  }, [courses, statusFilter, categoryFilter, searchQuery]);

  const handleToggleStatus = async (course) => {
    const nextStatus = course.status === 'published' ? 'unpublished' : 'published';
    try {
      await courseEndpoints.updateCourseStatus(course.id, nextStatus);
      setCourses(
        courses.map((item) =>
          item.id === course.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      alert(`Could not change course status: ${err.message}`);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!confirm(`Are you sure you want to delete "${course.name}" and all its syllabus content?`)) return;
    try {
      await courseEndpoints.deleteCourse(course.id);
      setCourses(courses.filter((c) => c.id !== course.id));
    } catch (err) {
      alert(`Failed to delete course: ${err.message}`);
    }
  };

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>ACADEMIC MANAGEMENT</Text>
          <Text style={styles.headerTitle}>Course Management & Curriculum Studio</Text>
          <Text style={styles.headerSubtitle}>
            Create, structure modules & lessons, manage fees, and publish courses.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addCourseBtn}
            onPress={() => {
              setSelectedCourseId(null);
              setIsEditorOpen(true);
            }}
          >
            <Text style={styles.addCourseBtnText}>+ Add New Course</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchCourses}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TOTAL COURSES</Text>
          <Text style={styles.statVal}>{courses.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PUBLISHED (LIVE)</Text>
          <Text style={[styles.statVal, { color: '#22C55E' }]}>{publishedCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DRAFTS</Text>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>{draftCount}</Text>
        </View>
      </View>

      {/* Filter Tabs & Search */}
      <View style={styles.filtersRow}>
        {/* Status Tabs */}
        <View style={styles.statusTabs}>
          {[
            { id: 'all', label: 'All' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'unpublished', label: 'Unpublished' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.statusTabBtn,
                statusFilter === tab.id && styles.statusTabBtnActive,
              ]}
              onPress={() => setStatusFilter(tab.id)}
            >
              <Text
                style={[
                  styles.statusTabBtnText,
                  statusFilter === tab.id && styles.statusTabBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Course Cards Grid */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading course catalog from database...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCourses}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCourses.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No courses found</Text>
          <Text style={styles.emptySubtitle}>Click "+ Add New Course" to create one.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countText}>
            Showing {filteredCourses.length} of {courses.length} courses
          </Text>

          {/* Responsive 3-Column Cards Grid */}
          <View style={styles.cardsGrid}>
            {filteredCourses.map((c) => {
              const isPublished = c.status === 'published';
              const isDraft = c.status === 'draft';

              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.courseCard,
                    isPublished && styles.courseCardPublished,
                  ]}
                  onPress={() => {
                    setSelectedCourseId(c.id);
                    setIsEditorOpen(true);
                  }}
                  activeOpacity={0.85}
                >
                  {/* Thumbnail / Header */}
                  {c.thumbnail ? (
                    <Image source={{ uri: c.thumbnail }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.placeholderIcon}>🎬</Text>
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.categoryBadge}>{c.category}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: isPublished
                              ? 'rgba(34, 197, 94, 0.15)'
                              : isDraft
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            borderColor: isPublished
                              ? '#22C55E'
                              : isDraft
                              ? '#F59E0B'
                              : '#EF4444',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            {
                              color: isPublished
                                ? '#22C55E'
                                : isDraft
                                ? '#F59E0B'
                                : '#EF4444',
                            },
                          ]}
                        >
                          ● {c.status?.toUpperCase() || 'DRAFT'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.courseTitle} numberOfLines={1}>
                      {c.name}
                    </Text>

                    <Text style={styles.courseDesc} numberOfLines={2}>
                      {c.short_desc || 'No description provided.'}
                    </Text>

                    {/* Metadata Pill Grid */}
                    <View style={styles.metaGrid}>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaKey}>FEE</Text>
                        <Text style={styles.metaVal}>
                          ₹{Number(c.fees || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaKey}>DURATION</Text>
                        <Text style={styles.metaVal}>{c.duration || '6 Mos'}</Text>
                      </View>
                      <View style={styles.metaCol}>
                        <Text style={styles.metaKey}>MODULES</Text>
                        <Text style={[styles.metaVal, { color: '#F59E0B' }]}>
                          {c.modules_count || 0}
                        </Text>
                      </View>
                    </View>

                    {/* Card Actions Footer */}
                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={[
                          styles.publishBtn,
                          isPublished && styles.unpublishBtn,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(c);
                        }}
                      >
                        <Text
                          style={[
                            styles.publishBtnText,
                            isPublished && styles.unpublishBtnText,
                          ]}
                        >
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setSelectedCourseId(c.id);
                          setIsEditorOpen(true);
                        }}
                      >
                        <Text style={styles.editBtnText}>Manage ➔</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteIconBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(c);
                        }}
                      >
                        <Text style={styles.deleteIconText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* Course Editor & Curriculum Studio Modal */}
      <CourseEditorModal
        visible={isEditorOpen}
        courseId={selectedCourseId}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedCourseId(null);
        }}
        onSaved={() => fetchCourses()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0f17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: '#121622',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2638',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCourseBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addCourseBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
  },
  refreshBtn: {
    backgroundColor: '#1a2030',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2c364d',
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingTop: 14,
    gap: 12,
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#121622',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: '#121622',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  statusTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusTabBtnActive: {
    backgroundColor: '#F59E0B',
  },
  statusTabBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  statusTabBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1e2638',
    minWidth: 220,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  list: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  countText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  /* Responsive 3-Column Cards Grid */
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 380,
    backgroundColor: '#121622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2638',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  courseCardPublished: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#0c0f17',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#0c0f17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  cardContent: {
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '900',
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  courseDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: '#0c0f17',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e2638',
    marginVertical: 4,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaKey: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2638',
  },
  publishBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  publishBtnText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '800',
  },
  unpublishBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  unpublishBtnText: {
    color: '#EF4444',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  deleteIconBtn: {
    padding: 6,
  },
  deleteIconText: {
    fontSize: 14,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  retryBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#000000',
    fontWeight: '800',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
});

