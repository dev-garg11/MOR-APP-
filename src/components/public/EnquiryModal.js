import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MORPH_COURSES } from '../../data/coursesData';
import { createLead } from '../../services/endpoints';
import { theme } from '../../theme';
import { getStoredLeadSource, normalizeSource } from '../../utils/leadSourceDetector';

export function EnquiryModal({ visible, defaultCourse, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState(defaultCourse || '3D Animation Masterclass');
  const [source, setSource] = useState('website_direct');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      if (defaultCourse) setCourse(defaultCourse);
      getStoredLeadSource().then((data) => {
        if (data?.source) {
          setSource(normalizeSource(data.source));
        }
      });
      setErrors({});
      setSubmitted(false);
    }
  }, [visible, defaultCourse]);

  const validateForm = () => {
    const errs = {};

    if (!name.trim()) {
      errs.name = 'Full Name is required';
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone Number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit phone number';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        course_interest: course,
        source: source,
        notes: message.trim() || `User enquired for ${course}`,
      };

      // Calls live backend POST /leads/
      await createLead(payload);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to submit enquiry. Check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = `Hi Morph Academy, I have submitted an enquiry for *${course}*. My name is ${name}. Please share the syllabus and batch timings.`;
    Linking.openURL(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`);
  };

  const resetAndClose = () => {
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
    setSubmitted(false);
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {submitted ? (
            /* SUCCESS CONFIRMATION STATE */
            <View style={styles.successBox}>
              <View style={styles.successBadgeIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>

              <Text style={styles.successTitle}>Enquiry Submitted Successfully!</Text>
              <Text style={styles.successSubtitle}>
                Your enquiry has been submitted successfully to Morph Academy Admissions.
              </Text>

              {/* Summary Details */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Student Name:</Text>
                  <Text style={styles.summaryVal}>{name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Course Selected:</Text>
                  <Text style={[styles.summaryVal, { color: theme.colors.primary }]}>{course}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Contact Phone:</Text>
                  <Text style={styles.summaryVal}>{phone}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Status:</Text>
                  <Text style={[styles.summaryVal, { color: theme.colors.success }]}>
                    Assigned to Senior Counselor
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.whatsAppBtn} onPress={handleOpenWhatsApp}>
                <Text style={styles.whatsAppBtnText}>💬 Connect with Counselor on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeDoneBtn} onPress={resetAndClose}>
                <Text style={styles.closeDoneBtnText}>Done / Back to Academy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ENQUIRY FORM */
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.badge}>ACADEMIC ENQUIRY</Text>
                  <Text style={styles.title}>Book Free Counseling</Text>
                </View>
                <TouchableOpacity onPress={resetAndClose} style={styles.closeIconBtn}>
                  <Text style={styles.closeIconText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subtext}>
                Get personalized course guidance, curriculum syllabus, and fee installment options.
              </Text>

              <View style={styles.formSection}>
                {/* 1. Full Name */}
                <Text style={styles.fieldLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={theme.colors.textMuted}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

                {/* 2. Phone Number */}
                <Text style={styles.fieldLabel}>
                  Phone Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={14}
                />
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                {/* 3. Email Address */}
                <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="your.email@example.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                {/* 4. Select Program */}
                <Text style={styles.fieldLabel}>
                  Course Interested In <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.chipGrid}>
                  {MORPH_COURSES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, course === c.title && styles.chipActive]}
                      onPress={() => setCourse(c.title)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          course === c.title && styles.chipTextActive,
                        ]}
                      >
                        {c.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 5. Message / Query */}
                <Text style={styles.fieldLabel}>Message / Specific Questions (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Ask about batch timings, scholarship, hostel, or workstation specs..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                />

                {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textDark} />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Enquiry ➔</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtext: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  closeIconBtn: {
    padding: 6,
  },
  closeIconText: {
    color: theme.colors.textMuted,
    fontSize: 20,
  },
  formSection: {
    gap: 10,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: -2,
  },
  requiredStar: {
    color: theme.colors.danger,
    fontWeight: '800',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...theme.shadows.glowPrimary,
  },
  submitBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 11,
    marginTop: -4,
    marginBottom: 2,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  successBadgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...theme.shadows.sm,
  },
  successIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  successTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 18,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryKey: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  summaryVal: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  whatsAppBtn: {
    width: '100%',
    backgroundColor: '#25D366',
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  closeDoneBtn: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeDoneBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
});
