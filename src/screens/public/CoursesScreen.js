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
import { MORPHY_COURSES } from '../../data/coursesData';
import { courseEndpoints } from '../../services/endpoints';

const CATEGORIES = [
  'All Programs',
  '3D Animation',
  'VFX',
  'Game Design',
  'Graphic & UI/UX',
  'Filmmaking',
  'Fashion Designing',
  'Digital Marketing',
  'Web Development',
  'Motion Graphics',
];

export function CoursesScreen({ onSelectCourse, onEnquireCourse }) {
  const [courses, setCourses] = useState(MORPHY_COURSES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Programs');

  useEffect(() => {
    courseEndpoints
      .getPublicCourses()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCourses(res.data);
        }
      })
      .catch(() => {
        // Retain initial MORPHY_COURSES smoothly
      });
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchCategory =
        selectedCategory === 'All Programs' ||
        (course.category && course.category.toLowerCase() === selectedCategory.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const title = course.title || course.name || '';
      const shortDesc = course.shortDesc || course.short_desc || '';
      const tools = course.tools || [];
      const matchSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        shortDesc.toLowerCase().includes(q) ||
        tools.some((t) => typeof t === 'string' && t.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [courses, searchQuery, selectedCategory]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>ACADEMIC CATALOG</Text>
          <Text style={styles.badgeSub}>• MORPH & ZURI CREATIVE TECH INSTITUTE</Text>
        </View>
        <Text style={styles.title}>Explore Studio-Standard Programs</Text>
        <Text style={styles.subtitle}>
          Industry-aligned diplomas in 3D Animation, Film VFX, Unreal Engine 5, UI/UX, Filmmaking, and Full Stack Tech with 100% placement support.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by course name, Maya, Unreal Engine, Nuke, Figma..."
            placeholderTextColor="#64748B"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Courses Grid Content */}
      <View style={styles.contentSection}>
        <View style={styles.catalogStatsRow}>
          <Text style={styles.catalogCountText}>
            Showing <Text style={{ color: '#F59E0B', fontWeight: '900' }}>{filteredCourses.length}</Text> Professional Programs
          </Text>
          <Text style={styles.catalogAssuranceText}>
            ✓ 100% Placement Assistance • Studio Workstations • ISO Certified
          </Text>
        </View>

        {filteredCourses.length === 0 ? (
          <View style={styles.noResultsBox}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsTitle}>No matching courses found</Text>
            <Text style={styles.noResultsSub}>
              Try searching with another keyword or resetting the category filter.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All Programs');
              }}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Responsive 3-Column Studio Grid */
          <View style={styles.cardsGrid}>
            {filteredCourses.map((course) => {
              const title = course.title || course.name;
              const image = course.image || course.thumbnail;
              const shortDesc = course.shortDesc || course.short_desc;
              const price = course.price || (course.fees ? `₹${Number(course.fees).toLocaleString()}` : 'Contact Admissions');
              const emi = course.emi || 'No-Cost EMI Available';
              const tag = course.tag || '⭐ Studio Track';
              const tools = course.tools || [];
              const modulesCount = course.modules_count || course.modules?.length || 4;

              return (
                <TouchableOpacity
                  key={course.id || course.slug}
                  style={styles.courseCard}
                  onPress={() => onSelectCourse(course)}
                  activeOpacity={0.88}
                >
                  {/* Thumbnail Banner */}
                  <View style={styles.imageWrapper}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.courseImage} />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Text style={{ fontSize: 36 }}>🎬</Text>
                      </View>
                    )}
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{tag}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>⏱ {course.duration || '6 Months'}</Text>
                    </View>
                  </View>

                  {/* Body Info */}
                  <View style={styles.cardBody}>
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryLabel}>{course.category?.toUpperCase()}</Text>
                      <Text style={styles.modulesBadge}>{modulesCount} Modules</Text>
                    </View>

                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {title}
                    </Text>

                    <Text style={styles.shortDesc} numberOfLines={2}>
                      {shortDesc}
                    </Text>

                    {/* Tools Tags */}
                    {tools.length > 0 ? (
                      <View style={styles.toolsRow}>
                        {tools.slice(0, 3).map((tool, idx) => (
                          <View key={idx} style={styles.toolTag}>
                            <Text style={styles.toolText} numberOfLines={1}>
                              🛠 {tool}
                            </Text>
                          </View>
                        ))}
                        {tools.length > 3 ? (
                          <View style={styles.toolTagMore}>
                            <Text style={styles.toolTextMore}>+{tools.length - 3}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* Pricing & CTAs */}
                    <View style={styles.cardFooter}>
                      <View style={styles.priceCol}>
                        <Text style={styles.priceText}>{price}</Text>
                        <Text style={styles.emiText}>{emi}</Text>
                      </View>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.enquireBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            onEnquireCourse(title);
                          }}
                        >
                          <Text style={styles.enquireBtnText}>Enquire</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => onSelectCourse(course)}
                        >
                          <Text style={styles.detailsBtnText}>Details ➔</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090C10',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#121622',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2638',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  badgeSub: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
    maxWidth: 720,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090C10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2638',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 16,
    paddingHorizontal: 6,
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#090C10',
    borderWidth: 1,
    borderColor: '#1e2638',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  catalogStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catalogCountText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  catalogAssuranceText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700',
  },
  /* Responsive 3-Column Studio Grid */
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseCard: {
    flex: 1,
    minWidth: 310,
    maxWidth: 380,
    backgroundColor: '#121622',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e2638',
    justifyContent: 'space-between',
  },
  imageWrapper: {
    position: 'relative',
    height: 160,
    backgroundColor: '#090C10',
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090C10',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(9, 12, 16, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  tagBadgeText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(9, 12, 16, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modulesBadge: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#090C10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  shortDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  toolTag: {
    backgroundColor: '#090C10',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  toolText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  toolTagMore: {
    backgroundColor: '#090C10',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  toolTextMore: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e2638',
    paddingTop: 10,
    marginTop: 4,
  },
  priceCol: {
    justifyContent: 'center',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  emiText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  enquireBtn: {
    backgroundColor: '#090C10',
    borderWidth: 1,
    borderColor: '#2c364d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enquireBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#121622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2638',
    paddingHorizontal: 20,
  },
  noResultsIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  noResultsSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetFilterText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
});
