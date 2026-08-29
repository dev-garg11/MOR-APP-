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
import { addLeadNote, updateLeadStatus } from '../../services/endpoints';
import { theme } from '../../theme';
import { LeadSourceBadge, LeadStatusBadge } from '../common/StatusBadge';

const HR_STATUSES = [
  { key: 'new', label: 'NEW', color: theme.colors.warning },
  { key: 'contacted', label: 'CONTACTED', color: theme.colors.info },
  { key: 'follow_up', label: 'FOLLOW_UP', color: '#A78BFA' },
  { key: 'interested', label: 'INTERESTED', color: theme.colors.primary },
  { key: 'admitted', label: 'ADMITTED', color: theme.colors.success },
  { key: 'not_interested', label: 'NOT_INTERESTED', color: theme.colors.textMuted },
  { key: 'closed', label: 'CLOSED', color: theme.colors.danger },
];

export function EnquiryDetailModal({ visible, lead, onClose, onLeadUpdated }) {
  const [currentStatus, setCurrentStatus] = useState('new');
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  useEffect(() => {
    if (lead) {
      setCurrentStatus(lead.status || 'new');
      setFollowUpDate(lead.next_follow_up ? String(lead.next_follow_up) : '');
      setNewNote('');
      setActionSuccessMsg('');
      setActionErrorMsg('');
    }
  }, [lead, visible]);

  if (!lead) return null;

  const handleStatusUpdate = async (nextStatus) => {
    if (!lead?.id) {
      setActionErrorMsg('Invalid lead ID.');
      return;
    }
    setUpdatingStatus(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');
    try {
      const payload = {
        status: nextStatus,
        next_follow_up: followUpDate ? followUpDate : undefined,
        notes: newNote.trim() || undefined,
      };

      const res = await updateLeadStatus(lead.id, payload);
      const updated = res?.data || res;
      setCurrentStatus(nextStatus);
      if (newNote.trim()) setNewNote('');
      setActionSuccessMsg(`Status updated to ${nextStatus.toUpperCase()} successfully.`);
      if (onLeadUpdated && updated?.id) onLeadUpdated(updated);
    } catch (err) {
      setActionErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveFollowUp = async (customDate = null) => {
    if (!lead?.id) return;
    const targetDate = customDate || followUpDate;
    if (!targetDate) {
      setActionErrorMsg('Please select or enter a valid date (YYYY-MM-DD).');
      return;
    }
    setSavingFollowUp(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');
    try {
      const payload = {
        status: currentStatus,
        next_follow_up: targetDate,
      };
      const res = await updateLeadStatus(lead.id, payload);
      const updated = res?.data || res;
      setFollowUpDate(targetDate);
      setActionSuccessMsg(`Follow-up scheduled for ${targetDate} successfully.`);
      if (onLeadUpdated && updated?.id) onLeadUpdated(updated);
    } catch (err) {
      setActionErrorMsg(err.message || 'Failed to schedule follow-up.');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleSetQuickFollowUp = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    setFollowUpDate(formatted);
    handleSaveFollowUp(formatted);
  };

  const handleAddNoteOnly = async () => {
    if (!lead?.id) return;
    if (!newNote.trim()) {
      setActionErrorMsg('Please type a note before saving.');
      return;
    }

    setSavingNote(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');
    try {
      const res = await addLeadNote(lead.id, newNote.trim());
      const updated = res?.data || res;
      setNewNote('');
      setActionSuccessMsg('HR note saved successfully.');
      if (onLeadUpdated && updated?.id) onLeadUpdated(updated);
    } catch (err) {
      setActionErrorMsg(err.message || 'Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${lead.phone}`);
  };

  const handleWhatsApp = () => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hi ${lead.name}, this is the HR & Admissions team from Morphy Academy regarding your enquiry for *${lead.course_interest || 'Creative Courses'}*. Are you available for a quick discussion?`;
    Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerBadge}>ENQUIRY #{lead.id}</Text>
                <Text style={styles.headerTitle}>{lead.name}</Text>
                <Text style={styles.headerSub}>
                  Submitted on {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Action Contact Bar */}
            <View style={styles.contactBar}>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Text style={styles.callBtnText}>📞 Call {lead.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}>
                <Text style={styles.waBtnText}>💬 Chat on WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Lead Metadata Info Grid */}
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Course Interested:</Text>
                <Text style={[styles.metaVal, { color: theme.colors.primary }]}>
                  {lead.course_interest || 'General Admissions'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Email Address:</Text>
                <Text style={styles.metaVal}>{lead.email || 'Not Provided'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Acquisition Source:</Text>
                <LeadSourceBadge source={lead.source} />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Current Status:</Text>
                <LeadStatusBadge status={currentStatus} />
              </View>
              {lead.next_follow_up ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Scheduled Follow-up:</Text>
                  <Text style={[styles.metaVal, { color: theme.colors.warning, fontWeight: '800' }]}>
                    📅 {String(lead.next_follow_up)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Alerts */}
            {actionSuccessMsg ? (
              <Text style={styles.successText}>✓ {actionSuccessMsg}</Text>
            ) : null}
            {actionErrorMsg ? (
              <Text style={styles.errorText}>⚠ {actionErrorMsg}</Text>
            ) : null}

            {/* 1. STATUS PIPELINE TRANSITION BUTTONS */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>UPDATE ENQUIRY STATUS</Text>
              <Text style={styles.sectionDesc}>Select the next stage in the HR pipeline:</Text>
              <View style={styles.statusButtonsGrid}>
                {HR_STATUSES.map((st) => {
                  const isActive = currentStatus === st.key;
                  return (
                    <TouchableOpacity
                      key={st.key}
                      style={[
                        styles.statusBtn,
                        isActive && { backgroundColor: st.color, borderColor: st.color },
                      ]}
                      onPress={() => handleStatusUpdate(st.key)}
                      disabled={updatingStatus}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          isActive && { color: theme.colors.textDark, fontWeight: '900' },
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. ADMISSION STATUS BRIDGE (Step 2 -> Step 3 readiness) */}
            {currentStatus === 'admitted' ? (
              <View style={styles.admittedBridgeBox}>
                <Text style={styles.admittedBadge}>🎓 ENROLMENT READY</Text>
                <Text style={styles.admittedTitle}>Student Admission Registered</Text>
                <Text style={styles.admittedDesc}>
                  This enquiry is marked as ADMITTED and is ready for Student Credentials & Fee Plan generation in Step 3.
                </Text>
              </View>
            ) : null}

            {/* 3. SCHEDULE FOLLOW-UP */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>SCHEDULE NEXT FOLLOW-UP</Text>
              <View style={styles.quickDateRow}>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickFollowUp(0)}
                >
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickFollowUp(1)}
                >
                  <Text style={styles.quickDateText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickFollowUp(3)}
                >
                  <Text style={styles.quickDateText}>In 3 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => handleSetQuickFollowUp(7)}
                >
                  <Text style={styles.quickDateText}>Next Week</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  value={followUpDate}
                  onChangeText={setFollowUpDate}
                  placeholder="YYYY-MM-DD (e.g. 2026-08-25)"
                  placeholderTextColor={theme.colors.textMuted}
                />
                <TouchableOpacity
                  style={[styles.saveDateBtn, savingFollowUp && styles.btnDisabled]}
                  onPress={() => handleSaveFollowUp()}
                  disabled={savingFollowUp}
                >
                  {savingFollowUp ? (
                    <ActivityIndicator size="small" color={theme.colors.textDark} />
                  ) : (
                    <Text style={styles.saveDateBtnText}>💾 Set Date</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. HR COUNSELOR NOTES */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>HR & COUNSELOR NOTES LOG</Text>
              <View style={styles.notesHistoryBox}>
                <Text style={styles.notesHistoryText}>
                  {lead.notes || 'No notes added yet for this enquiry.'}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Add New Remark / Call Summary:</Text>
              <TextInput
                style={styles.noteInput}
                value={newNote}
                onChangeText={setNewNote}
                placeholder="e.g. Student visited lab, interested in Maya 12M batch. Callback on Monday."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.saveNoteBtn, savingNote && styles.btnDisabled]}
                onPress={handleAddNoteOnly}
                disabled={savingNote}
              >
                {savingNote ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.saveNoteBtnText}>Save HR Note ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '94%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 20,
  },
  contactBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  callBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  callBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  waBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  waBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  metaVal: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  sectionHeading: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  admittedBridgeBox: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.success,
    marginBottom: 14,
  },
  admittedBadge: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  admittedTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  admittedDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickDateBtn: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickDateText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 13,
  },
  saveDateBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDateBtnText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  notesHistoryBox: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.sm,
    padding: 12,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  notesHistoryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 13,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 11,
    alignItems: 'center',
    ...theme.shadows.glowPrimary,
  },
  saveNoteBtnText: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 12,
    backgroundColor: theme.colors.successLight,
    padding: 10,
    borderRadius: theme.radius.xs,
    marginBottom: 12,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    backgroundColor: theme.colors.dangerLight,
    padding: 10,
    borderRadius: theme.radius.xs,
    marginBottom: 12,
  },
});

