import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdmitStudentModal } from '../../components/admin/AdmitStudentModal';
import { LeadSourceBadge, LeadStatusBadge } from '../../components/common/StatusBadge';
import { listLeads, updateLead } from '../../services/endpoints';
import { theme } from '../../theme';
import { normalizeSource } from '../../utils/leadSourceDetector';

const STATUS_FILTERS = ['all', 'new', 'contacted', 'demo_booked', 'enrolled', 'lost'];
const SOURCE_FILTERS = ['all', 'instagram', 'youtube', 'google_ads', 'whatsapp', 'website_direct'];

export function LeadsCrmScreen() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  const [selectedLeadForAdmission, setSelectedLeadForAdmission] = useState(null);

  const fetchLeadsData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listLeads();
      setLeads(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leads from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const handleStatusChange = async (leadId, nextStatus) => {
    try {
      await updateLead(leadId, { status: nextStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleWhatsApp = (lead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hi ${lead.name}, this is counselor team from Morphy Academy regarding your enquiry for ${lead.course_interest || 'Creative Courses'}. Are you available for a quick discussion?`;
    Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`);
  };

  const handleCall = (lead) => {
    Linking.openURL(`tel:${lead.phone}`);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.course_interest && item.course_interest.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const leadNormalizedSource = normalizeSource(item.source);
      const matchesSource =
        selectedSource === 'all' || leadNormalizedSource === selectedSource;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchQuery, selectedStatus, selectedSource]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>OPERATIONS & ADMISSIONS</Text>
          <Text style={styles.headerTitle}>Lead Management CRM</Text>
          <Text style={styles.headerSubtitle}>
            Track enquiry sources (Instagram, YouTube, Ads) and manage student conversions.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLeadsData}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filters */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search leads by name, phone, course..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Source Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={styles.filterLabel}>Source:</Text>
          {SOURCE_FILTERS.map((src) => (
            <TouchableOpacity
              key={src}
              style={[styles.filterChip, selectedSource === src && styles.filterChipActive]}
              onPress={() => setSelectedSource(src)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSource === src && styles.filterChipTextActive,
                ]}
              >
                {src.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          {STATUS_FILTERS.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, selectedStatus === st && styles.filterChipActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === st && styles.filterChipTextActive,
                ]}
              >
                {st.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leads List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading lead records from server…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchLeadsData}>
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : filteredLeads.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No leads found</Text>
          <Text style={styles.emptySubtitle}>Try changing your search query or filters.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsCount}>
            Showing {filteredLeads.length} of {leads.length} total leads
          </Text>

          {filteredLeads.map((lead) => (
            <View key={lead.id} style={styles.leadCard}>
              {/* Top Row: Badges & Time */}
              <View style={styles.cardHeader}>
                <View style={styles.badgeGroup}>
                  <LeadSourceBadge source={lead.source} />
                  <LeadStatusBadge status={lead.status} />
                </View>
                <Text style={styles.leadDate}>
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ''}
                </Text>
              </View>

              {/* Lead Details */}
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadCourse}>🎯 {lead.course_interest || 'General Tech Enquiry'}</Text>
                <Text style={styles.leadContact}>
                  📞 {lead.phone} {lead.email ? `• ✉️ ${lead.email}` : ''}
                </Text>
                {lead.notes ? <Text style={styles.leadNotes}>📝 "{lead.notes}"</Text> : null}
              </View>

              {/* Status Update Quick Select */}
              <View style={styles.statusSelectRow}>
                <Text style={styles.statusChangeLabel}>Update Status:</Text>
                {['contacted', 'demo_booked', 'lost'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.quickStatusBtn,
                      lead.status === st && styles.quickStatusBtnActive,
                    ]}
                    onPress={() => handleStatusChange(lead.id, st)}
                  >
                    <Text style={styles.quickStatusBtnText}>
                      {st === 'demo_booked' ? 'Demo' : st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.waBtn} onPress={() => handleWhatsApp(lead)}>
                  <Text style={styles.waBtnText}>💬 WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(lead)}>
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </TouchableOpacity>

                {lead.status !== 'enrolled' ? (
                  <TouchableOpacity
                    style={styles.admitBtn}
                    onPress={() => setSelectedLeadForAdmission(lead)}
                  >
                    <Text style={styles.admitBtnText}>🎓 Admit Student</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.enrolledTag}>
                    <Text style={styles.enrolledTagText}>✓ Student Enrolled</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 1-Click Admit Student Modal */}
      {selectedLeadForAdmission ? (
        <AdmitStudentModal
          visible={Boolean(selectedLeadForAdmission)}
          lead={selectedLeadForAdmission}
          onClose={() => setSelectedLeadForAdmission(null)}
          onSuccess={() => {
            fetchLeadsData();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  refreshBtn: {
    backgroundColor: theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  refreshBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  filterSection: {
    backgroundColor: theme.colors.surfaceCard,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: theme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    alignSelf: 'center',
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
  listContainer: {
    flex: 1,
  },
  resultsCount: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
  },
  leadCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 14,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  leadDate: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  leadInfo: {
    marginBottom: 12,
    gap: 3,
  },
  leadName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  leadCourse: {
    color: theme.colors.accentCyan,
    fontSize: 13,
    fontWeight: '600',
  },
  leadContact: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  leadNotes: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 10,
  },
  statusChangeLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  quickStatusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickStatusBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  quickStatusBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  waBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  callBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  admitBtn: {
    flex: 1.3,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    ...theme.shadows.glowPrimary,
  },
  admitBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 12,
  },
  enrolledTag: {
    flex: 1.3,
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.success,
    paddingVertical: 10,
    alignItems: 'center',
  },
  enrolledTagText: {
    color: theme.colors.success,
    fontWeight: '800',
    fontSize: 11,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  retryBtnText: {
    color: theme.colors.textDark,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});

