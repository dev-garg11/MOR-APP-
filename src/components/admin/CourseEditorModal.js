import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { courseEndpoints } from '../../services/endpoints';
import { theme } from '../../theme';

const CATEGORIES = [
  '3D Animation',
  'VFX',
  'Game Design',
  'Motion Graphics',
  'Concept Art',
  'Web Development',
  'Graphic Design',
  'Digital Marketing',
];

export function CourseEditorModal({ visible, courseId, onClose, onSaved }) {
  const isEditing = Boolean(courseId);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'curriculum' | 'preview'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Course Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('3D Animation');
  const [level, setLevel] = useState('Beginner to Advanced');
  const [duration, setDuration] = useState('6 Months');
  const [fees, setFees] = useState('');
  const [emi, setEmi] = useState('');
  const [tag, setTag] = useState('Flagship Program');
  const [thumbnail, setThumbnail] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [toolsStr, setToolsStr] = useState('');
  const [outcomesStr, setOutcomesStr] = useState('');
  const [requirementsStr, setRequirementsStr] = useState('');
  const [status, setStatus] = useState('draft');

  // Curriculum State
  const [modules, setModules] = useState([]);
  const [newModTitle, setNewModTitle] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [selectedModForLesson, setSelectedModForLesson] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('45 Mins');

  useEffect(() => {
    if (visible && courseId) {
      loadCourseDetail(courseId);
    } else if (visible && !courseId) {
      resetForm();
    }
  }, [visible, courseId]);

  const resetForm = () => {
    setName('');
    setCategory('3D Animation');
    setLevel('Beginner to Advanced');
    setDuration('6 Months');
    setFees('');
    setEmi('');
    setTag('Popular Program');
    setThumbnail('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80');
    setShortDesc('');
    setFullDesc('');
    setToolsStr('Maya, Blender, ZBrush');
    setOutcomesStr('Build realistic 3D models, Animate walking cycles');
    setRequirementsStr('No prior coding needed, Basic computer literacy');
    setStatus('draft');
    setModules([]);
    setActiveTab('info');
    setError('');
    setSuccessMsg('');
  };

  const loadCourseDetail = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await courseEndpoints.getAdminCourseDetail(id);
      const c = res.data;
      setName(c.name || '');
      setCategory(c.category || '3D Animation');
      setLevel(c.level || 'Beginner to Advanced');
      setDuration(c.duration || '6 Months');
      setFees(String(c.fees || ''));
      setEmi(c.emi || '');
      setTag(c.tag || '');
      setThumbnail(c.thumbnail || '');
      setShortDesc(c.short_desc || '');
      setFullDesc(c.full_desc || '');
      setToolsStr((c.tools || []).join(', '));
      setOutcomesStr((c.outcomes || []).join('\n'));
      setRequirementsStr((c.requirements || []).join('\n'));
      setStatus(c.status || 'draft');
      setModules(c.modules || []);
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourseInfo = async () => {
    if (!name.trim()) {
      setError('Course Name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    const payload = {
      name: name.trim(),
      category: category.trim(),
      level: level.trim(),
      duration: duration.trim(),
      fees: fees ? parseFloat(fees) : 0,
      emi: emi.trim() || undefined,
      tag: tag.trim() || undefined,
      thumbnail: thumbnail.trim() || undefined,
      short_desc: shortDesc.trim() || undefined,
      full_desc: fullDesc.trim() || undefined,
      tools: toolsStr ? toolsStr.split(',').map((t) => t.trim()).filter(Boolean) : [],
      outcomes: outcomesStr ? outcomesStr.split('\n').map((o) => o.trim()).filter(Boolean) : [],
      requirements: requirementsStr ? requirementsStr.split('\n').map((r) => r.trim()).filter(Boolean) : [],
      status: status,
    };

    try {
      let savedCourse;
      if (isEditing) {
        const res = await courseEndpoints.updateCourse(courseId, payload);
        savedCourse = res.data;
        setSuccessMsg('✓ Course details updated successfully!');
      } else {
        const res = await courseEndpoints.createCourse(payload);
        savedCourse = res.data;
        setSuccessMsg('✓ Course created successfully! You can now add curriculum modules.');
        if (onSaved) onSaved(savedCourse);
        // Switch to curriculum tab after creation
        loadCourseDetail(savedCourse.id);
        setActiveTab('curriculum');
      }

      if (onSaved) onSaved(savedCourse);
    } catch (err) {
      setError(err.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!courseId) {
      setError('Please save the course details first before publishing.');
      return;
    }

    const newStatus = status === 'published' ? 'unpublished' : 'published';
    setSaving(true);
    try {
      await courseEndpoints.updateCourseStatus(courseId, newStatus);
      setStatus(newStatus);
      setSuccessMsg(`✓ Course is now ${newStatus.toUpperCase()}!`);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || 'Failed to update course status.');
    } finally {
      setSaving(false);
    }
  };

  // Module Actions
  const handleAddModule = async () => {
    if (!newModTitle.trim()) return;
    if (!courseId) {
      setError('Save the course information first to add modules.');
      return;
    }

    setSaving(true);
    try {
      const res = await courseEndpoints.createCourseModule(courseId, {
        title: newModTitle.trim(),
        description: newModDesc.trim() || undefined,
        order_index: modules.length + 1,
      });
      setModules([...modules, res.data]);
      setNewModTitle('');
      setNewModDesc('');
    } catch (err) {
      setError(err.message || 'Failed to add module.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId, modTitle) => {
    if (!confirm(`Are you sure you want to delete module "${modTitle}" and all its lessons?`)) return;
    try {
      await courseEndpoints.deleteCourseModule(moduleId);
      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (err) {
      alert(`Could not delete module: ${err.message}`);
    }
  };

  // Lesson Actions
  const handleAddLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) return;
    try {
      const res = await courseEndpoints.createCourseLesson(moduleId, {
        title: newLessonTitle.trim(),
        duration: newLessonDuration.trim(),
      });
      setModules(
        modules.map((m) => {
          if (m.id === moduleId) {
            return { ...m, lessons: [...(m.lessons || []), res.data] };
          }
          return m;
        })
      );
      setNewLessonTitle('');
      setSelectedModForLesson(null);
    } catch (err) {
      alert(`Could not add lesson: ${err.message}`);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    try {
      await courseEndpoints.deleteCourseLesson(lessonId);
      setModules(
        modules.map((m) => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: (m.lessons || []).filter((l) => l.id !== lessonId),
            };
          }
          return m;
        })
      );
    } catch (err) {
      alert(`Could not delete lesson: ${err.message}`);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerBadge}>ACADEMIC CURRICULUM STUDIO</Text>
              <Text style={styles.headerTitle}>
                {isEditing ? `Edit: ${name || 'Course'}` : 'Create New Course'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabNav}>
            {[
              { id: 'info', label: '1. Course Details & Fees' },
              { id: 'curriculum', label: `2. Curriculum (${modules.length} Modules)` },
              { id: 'preview', label: '3. Preview & Publish' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabNavBtn, activeTab === tab.id && styles.tabNavBtnActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabNavBtnText,
                    activeTab === tab.id && styles.tabNavBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading course from database...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* TAB 1: BASIC INFO & PRICING */}
              {activeTab === 'info' && (
                <View style={styles.formSection}>
                  <Text style={styles.fieldLabel}>Course Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 3D Character Animation Masterclass"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                  />

                  <View style={styles.rowTwo}>
                    <View style={styles.col}>
                      <Text style={styles.fieldLabel}>Category *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 3D Animation"
                        placeholderTextColor="#64748B"
                        value={category}
                        onChangeText={setCategory}
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.fieldLabel}>Program Duration</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 12 Months"
                        placeholderTextColor="#64748B"
                        value={duration}
                        onChangeText={setDuration}
                      />
                    </View>
                  </View>

                  <View style={styles.rowTwo}>
                    <View style={styles.col}>
                      <Text style={styles.fieldLabel}>Total Course Fee (₹)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 65000"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={fees}
                        onChangeText={setFees}
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.fieldLabel}>No-Cost EMI (Monthly)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. ₹5,416/mo"
                        placeholderTextColor="#64748B"
                        value={emi}
                        onChangeText={setEmi}
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Course Thumbnail Image URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor="#64748B"
                    value={thumbnail}
                    onChangeText={setThumbnail}
                  />

                  <Text style={styles.fieldLabel}>Short Hook / Summary (1-2 sentences)</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    multiline
                    placeholder="Brief studio description..."
                    placeholderTextColor="#64748B"
                    value={shortDesc}
                    onChangeText={setShortDesc}
                  />

                  <Text style={styles.fieldLabel}>Full Detailed Overview</Text>
                  <TextInput
                    style={[styles.input, { height: 90 }]}
                    multiline
                    placeholder="Complete course description..."
                    placeholderTextColor="#64748B"
                    value={fullDesc}
                    onChangeText={setFullDesc}
                  />

                  <Text style={styles.fieldLabel}>Tools / Software Taught (comma-separated)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Maya, Blender, ZBrush, Arnold, Substance Painter"
                    placeholderTextColor="#64748B"
                    value={toolsStr}
                    onChangeText={setToolsStr}
                  />

                  <Text style={styles.fieldLabel}>What Students Will Learn (one per line)</Text>
                  <TextInput
                    style={[styles.input, { height: 75 }]}
                    multiline
                    placeholder="Animate biped and quadruped body mechanics&#10;Master facial rigging and phonetics"
                    placeholderTextColor="#64748B"
                    value={outcomesStr}
                    onChangeText={setOutcomesStr}
                  />

                  <Text style={styles.fieldLabel}>Prerequisites / Requirements (one per line)</Text>
                  <TextInput
                    style={[styles.input, { height: 65 }]}
                    multiline
                    placeholder="No prior 3D experience needed&#10;Basic interest in drawing or gaming"
                    placeholderTextColor="#64748B"
                    value={requirementsStr}
                    onChangeText={setRequirementsStr}
                  />

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveCourseInfo}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        💾 {isEditing ? 'Save Changes' : 'Save Course & Proceed to Curriculum ➔'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* TAB 2: CURRICULUM (MODULES & LESSONS) */}
              {activeTab === 'curriculum' && (
                <View style={styles.curriculumSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Course Syllabus & Hierarchy</Text>
                    <Text style={styles.sectionSub}>
                      {modules.length} Modules • {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Lessons
                    </Text>
                  </View>

                  {/* Add New Module Box */}
                  <View style={styles.addModuleCard}>
                    <Text style={styles.addModuleTitle}>+ Add New Module</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Module Title (e.g. 01 — Art & Anatomy Foundations)"
                      placeholderTextColor="#64748B"
                      value={newModTitle}
                      onChangeText={setNewModTitle}
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      placeholder="Module Description / Topics summary..."
                      placeholderTextColor="#64748B"
                      value={newModDesc}
                      onChangeText={setNewModDesc}
                    />
                    <TouchableOpacity
                      style={styles.addModuleBtn}
                      onPress={handleAddModule}
                      disabled={saving || !newModTitle.trim()}
                    >
                      <Text style={styles.addModuleBtnText}>+ Add Module to Syllabus</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Existing Modules List */}
                  {modules.length === 0 ? (
                    <View style={styles.emptyModuleBox}>
                      <Text style={styles.emptyModuleText}>
                        No modules added yet. Create your first module above.
                      </Text>
                    </View>
                  ) : (
                    modules.map((mod, idx) => (
                      <View key={mod.id} style={styles.moduleBox}>
                        <View style={styles.moduleHeader}>
                          <View style={styles.moduleTitleCol}>
                            <Text style={styles.moduleNumberBadge}>
                              MODULE {String(idx + 1).padStart(2, '0')}
                            </Text>
                            <Text style={styles.moduleTitleText}>{mod.title}</Text>
                            {mod.description ? (
                              <Text style={styles.moduleDescText}>{mod.description}</Text>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            style={styles.deleteModBtn}
                            onPress={() => handleDeleteModule(mod.id, mod.title)}
                          >
                            <Text style={styles.deleteModBtnText}>🗑 Delete</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Lessons inside this Module */}
                        <View style={styles.lessonsContainer}>
                          {(mod.lessons || []).map((les, lIdx) => (
                            <View key={les.id} style={styles.lessonRow}>
                              <Text style={styles.lessonNumber}>
                                {idx + 1}.{lIdx + 1}
                              </Text>
                              <Text style={styles.lessonTitle}>{les.title}</Text>
                              <Text style={styles.lessonDuration}>⏱ {les.duration || '45 Mins'}</Text>
                              <TouchableOpacity
                                onPress={() => handleDeleteLesson(mod.id, les.id)}
                              >
                                <Text style={styles.deleteLessonText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ))}

                          {/* Add Lesson Form for this module */}
                          {selectedModForLesson === mod.id ? (
                            <View style={styles.addLessonForm}>
                              <TextInput
                                style={styles.lessonInput}
                                placeholder="Lesson Title (e.g. IK/FK Arm Rigging)"
                                placeholderTextColor="#64748B"
                                value={newLessonTitle}
                                onChangeText={setNewLessonTitle}
                              />
                              <TextInput
                                style={[styles.lessonInput, { width: 100 }]}
                                placeholder="Duration"
                                placeholderTextColor="#64748B"
                                value={newLessonDuration}
                                onChangeText={setNewLessonDuration}
                              />
                              <TouchableOpacity
                                style={styles.saveLessonBtn}
                                onPress={() => handleAddLesson(mod.id)}
                              >
                                <Text style={styles.saveLessonBtnText}>Add</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.cancelLessonBtn}
                                onPress={() => setSelectedModForLesson(null)}
                              >
                                <Text style={styles.cancelLessonBtnText}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.addLessonTrigger}
                              onPress={() => {
                                setSelectedModForLesson(mod.id);
                                setNewLessonTitle('');
                                setNewLessonDuration('45 Mins');
                              }}
                            >
                              <Text style={styles.addLessonTriggerText}>+ Add Lesson</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 3: PREVIEW & PUBLISH */}
              {activeTab === 'preview' && (
                <View style={styles.previewSection}>
                  <View style={styles.statusBox}>
                    <View>
                      <Text style={styles.statusBoxLabel}>CURRENT COURSE STATUS</Text>
                      <Text
                        style={[
                          styles.statusBoxVal,
                          { color: status === 'published' ? '#22C55E' : '#F59E0B' },
                        ]}
                      >
                        ● {status.toUpperCase()}
                      </Text>
                      <Text style={styles.statusBoxSub}>
                        {status === 'published'
                          ? 'This course is visible to all website & mobile app users.'
                          : 'This course is currently in draft mode (hidden from public users).'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.publishToggleBtn,
                        status === 'published' && styles.unpublishBtn,
                      ]}
                      onPress={handleTogglePublish}
                      disabled={saving}
                    >
                      <Text
                        style={[
                          styles.publishToggleBtnText,
                          status === 'published' && styles.unpublishBtnText,
                        ]}
                      >
                        {status === 'published' ? '🚫 Unpublish Course' : '🚀 Publish Course Live'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Public Card Mockup */}
                  <Text style={styles.previewMockLabel}>LIVE PUBLIC CARD PREVIEW</Text>
                  <View style={styles.mockupCard}>
                    {thumbnail ? (
                      <Image source={{ uri: thumbnail }} style={styles.mockupImage} />
                    ) : null}
                    <View style={styles.mockupBody}>
                      <View style={styles.mockupBadgeRow}>
                        <Text style={styles.mockupCategory}>{category}</Text>
                        <Text style={styles.mockupTag}>{tag}</Text>
                      </View>
                      <Text style={styles.mockupTitle}>{name || 'Course Title'}</Text>
                      <Text style={styles.mockupDesc}>{shortDesc || 'Short description...'}</Text>
                      <View style={styles.mockupPricing}>
                        <Text style={styles.mockupFee}>₹{fees || '0'}</Text>
                        <Text style={styles.mockupEmi}>{emi || 'EMI available'}</Text>
                        <Text style={styles.mockupDuration}>⏱ {duration}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '90%',
    backgroundColor: '#121622',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#232a3d',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2638',
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
    fontSize: 20,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: '800',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#0c0f17',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2638',
  },
  tabNavBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavBtnActive: {
    borderBottomColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  tabNavBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabNavBtnTextActive: {
    color: '#F59E0B',
    fontWeight: '900',
  },
  modalBody: {
    flex: 1,
    padding: 22,
  },
  formSection: {
    gap: 10,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  curriculumSection: {
    gap: 14,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  addModuleCard: {
    backgroundColor: '#0c0f17',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  addModuleTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  addModuleBtn: {
    backgroundColor: '#1a2030',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2c364d',
  },
  addModuleBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  moduleBox: {
    backgroundColor: '#0c0f17',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2638',
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: '#151a28',
  },
  moduleTitleCol: {
    flex: 1,
  },
  moduleNumberBadge: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  moduleTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  moduleDescText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  deleteModBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteModBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  lessonsContainer: {
    padding: 12,
    gap: 8,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  lessonNumber: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  lessonTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lessonDuration: {
    color: '#64748B',
    fontSize: 11,
  },
  deleteLessonText: {
    color: '#EF4444',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  addLessonTrigger: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  addLessonTriggerText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  addLessonForm: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  lessonInput: {
    flex: 1,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#2c364d',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 11,
  },
  saveLessonBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  saveLessonBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  cancelLessonBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  cancelLessonBtnText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  previewSection: {
    gap: 16,
  },
  statusBox: {
    backgroundColor: '#0c0f17',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e2638',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusBoxLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBoxVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  statusBoxSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    maxWidth: 340,
  },
  publishToggleBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  publishToggleBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  unpublishBtn: {
    backgroundColor: '#1a2030',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  unpublishBtnText: {
    color: '#EF4444',
  },
  previewMockLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mockupCard: {
    backgroundColor: '#0c0f17',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2638',
    overflow: 'hidden',
    maxWidth: 380,
  },
  mockupImage: {
    width: '100%',
    height: 160,
  },
  mockupBody: {
    padding: 14,
    gap: 6,
  },
  mockupBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mockupCategory: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockupTag: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  mockupTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  mockupDesc: {
    color: '#94A3B8',
    fontSize: 11,
  },
  mockupPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2638',
  },
  mockupFee: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  mockupEmi: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  mockupDuration: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 'auto',
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginHorizontal: 22,
    marginTop: 10,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginHorizontal: 22,
    marginTop: 10,
  },
  successBannerText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyModuleBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#0c0f17',
    borderRadius: 10,
  },
  emptyModuleText: {
    color: '#64748B',
    fontSize: 12,
  },
});

