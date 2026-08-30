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

export function TeacherProfileScreen({ onLogout, onSwitchPublic }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      const res = await teacherEndpoints.getProfile();
      if (res.ok && res.data) {
        setProfile(res.data);
        setEditName(res.data.name || '');
        setEditPhone(res.data.phone || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setSaveError('Name cannot be empty.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await teacherEndpoints.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      if (res.ok && res.data) {
        setProfile(res.data);
        setSaveSuccess('Profile contact details updated successfully.');
        setTimeout(() => {
          setEditModalVisible(false);
          setSaveSuccess('');
        }, 1200);
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading faculty profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* 1. PROFILE HEADER CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'T'}
          </Text>
        </View>

        <Text style={styles.profileName}>{profile?.name || 'Faculty Member'}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>FACULTY / TRAINER</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>🟢 ACTIVE ACCOUNT</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editProfileBtnText}>✏️ Edit Contact Info</Text>
        </TouchableOpacity>
      </View>

      {/* 2. TEACHING SUMMARY KPIS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Teaching Authorization</Text>
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{profile?.assigned_courses_count ?? 0}</Text>
          <Text style={styles.kpiLabel}>Assigned Courses</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: theme.colors.accentCyan }]}>
            {profile?.assigned_batches_count ?? 0}
          </Text>
          <Text style={styles.kpiLabel}>Assigned Batches</Text>
        </View>
      </View>

      {/* 3. DETAILS LIST */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Faculty Details</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Designation</Text>
          <Text style={styles.infoValue}>{profile?.designation || 'Senior Faculty'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{profile?.department || 'Animation & VFX'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Number</Text>
          <Text style={styles.infoValue}>{profile?.phone || 'Not Set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Staff Account ID</Text>
          <Text style={styles.infoValue}>FAC-{profile?.id}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Access Permissions</Text>
          <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
            Assigned Batches & Courses Only
          </Text>
        </View>
      </View>

      {/* 4. ACTIONS */}
      <View style={styles.actionsBox}>
        <TouchableOpacity style={styles.switchWebsiteBtn} onPress={onSwitchPublic}>
          <Text style={styles.switchWebsiteText}>🌐 View Public Academy Website</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>🚪 Secure Logout</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✏️ Edit Faculty Contact Info</Text>
            <Text style={styles.modalSub}>
              Update your display name and contact number. Role and credentials can only be
              modified by Super Admin.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Faculty Full Name"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. 9811223344"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.readOnlyNote}>
              <Text style={styles.readOnlyText}>
                🔒 <Text style={{ fontWeight: '700' }}>Role & Email Locked:</Text> Your role (
                {profile?.role}) is locked to protect academy security.
              </Text>
            </View>

            {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
            {saveSuccess ? <Text style={styles.saveSuccessText}>{saveSuccess}</Text> : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.textDark} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  profileCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    ...theme.shadows.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: theme.colors.textDark,
    fontSize: 28,
    fontWeight: '900',
  },
  profileName: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileEmail: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  roleBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  statusBadgeText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  editProfileBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  editProfileBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  kpiValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsBox: {
    gap: 10,
  },
  switchWebsiteBtn: {
    backgroundColor: theme.colors.surfaceCard,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  switchWebsiteText: {
    color: theme.colors.accentSlate,
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dangerLight,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '700',
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
    maxWidth: 440,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  readOnlyNote: {
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: theme.radius.xs,
    marginBottom: 12,
  },
  readOnlyText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  saveErrorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  saveSuccessText: {
    color: theme.colors.success,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
});

