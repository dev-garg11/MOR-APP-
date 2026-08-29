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
import { EnquiryDetailModal } from '../../components/admin/EnquiryDetailModal';
import { LeadSourceBadge, LeadStatusBadge } from '../../components/common/StatusBadge';
import {
  getLeadStats,
  getTodayFollowups,
  listLeads,
} from '../../services/endpoints';
import { theme } from '../../theme';
import { normalizeSource } from '../../utils/leadSourceDetector';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'follow_up', label: 'Follow-Up' },
  { key: 'interested', label: 'Interested' },
  { key: 'admitted', label: 'Admitted' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'closed', label: 'Closed' },
];

export function HrDashboardScreen() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    follow_up: 0,
    interested: 0,
    admitted: 0,
    not_interested: 0,
    closed: 0,
    today_followups: 0,
  });

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showingTodayFollowupsOnly, setShowingTodayFollowupsOnly] = useState(false);

  // Selected lead for detail / follow-up modal
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchHrData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch real-time statistics
      const statsRes = await getLeadStats();
      setStats(statsRes.data || stats);

      // 2. Fetch leads or today's followups
      if (showingTodayFollowupsOnly) {
        const followupsRes = await getTodayFollowups();
        setLeads(followupsRes.data || []);
      } else {
        const leadsRes = await listLeads();
        setLeads(leadsRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load HR data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrData();
  }, [showingTodayFollowupsOnly]);

  const handleLeadUpdated = (updatedLead) => {
    const cleanLead = updatedLead?.data || updatedLead;
    if (!cleanLead || !cleanLead.id) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === cleanLead.id ? { ...l, ...cleanLead } : l))
    );
    setSelectedLead(cleanLead);
    // Refresh overview statistics in background
    getLeadStats().then((res) => {
      if (res?.data) setStats(res.data);
    }).catch(() => {});
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (lead) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hi ${lead.name}, this is the Admissions & Counseling team from Morphy Academy regarding your enquiry for ${lead.course_interest || 'Creative Tech Courses'}. Are you available for a quick discussion?`;
    Linking.openURL(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.course_interest && item.course_interest.toLowerCase().includes(q));

      const matchesStatus =
        selectedStatus === 'all' || item.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, selectedStatus]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>HR & COUNSELOR WORKSPACE</Text>
          <Text style={styles.headerTitle}>Enquiry & Admissions CRM</Text>
          <Text style={styles.headerSubtitle}>
            Manage incoming student enquiries, schedule follow-ups, and track admissions pipeline.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchHrData}>
          <Text style={styles.refreshBtnText}>🔄 Refresh Data</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* 1. REAL-TIME HR DASHBOARD KPI CARDS */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL ENQUIRIES</Text>
            <Text style={styles.kpiNumber}>{stats.total}</Text>
            <Text style={styles.kpiSub}>All Time Inflow</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: theme.colors.warning }]}>
            <Text style={[styles.kpiLabel, { color: theme.colors.warning }]}>NEW LEADS</Text>
            <Text style={[styles.kpiNumber, { color: theme.colors.warning }]}>{stats.new}</Text>
            <Text style={styles.kpiSub}>Uncontacted</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: theme.colors.info }]}>
            <Text style={[styles.kpiLabel, { color: theme.colors.info }]}>CONTACTED</Text>
            <Text style={[styles.kpiNumber, { color: theme.colors.info }]}>{stats.contacted}</Text>
            <Text style={styles.kpiSub}>Under Discussion</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: '#A78BFA' }]}>
            <Text style={[styles.kpiLabel, { color: '#A78BFA' }]}>FOLLOW-UPS</Text>
            <Text style={[styles.kpiNumber, { color: '#A78BFA' }]}>{stats.follow_up}</Text>
            <Text style={styles.kpiSub}>Scheduled</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.kpiLabel, { color: theme.colors.primary }]}>INTERESTED</Text>
            <Text style={[styles.kpiNumber, { color: theme.colors.primary }]}>{stats.interested}</Text>
            <Text style={styles.kpiSub}>High Conversion</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: theme.colors.success }]}>
            <Text style={[styles.kpiLabel, { color: theme.colors.success }]}>ADMISSIONS</Text>
            <Text style={[styles.kpiNumber, { color: theme.colors.success }]}>{stats.admitted}</Text>
            <Text style={styles.kpiSub}>Enrolment Ready</Text>
          </View>
        </View>

        {/* 2. TODAY'S FOLLOW-UP QUICK BANNER */}
        <TouchableOpacity
          style={[
            styles.todayFollowupBanner,
            showingTodayFollowupsOnly && styles.todayFollowupBannerActive,
          ]}
          onPress={() => setShowingTodayFollowupsOnly(!showingTodayFollowupsOnly)}
        >
          <View style={styles.todayBannerLeft}>
            <Text style={styles.todayBannerIcon}>⏰</Text>
            <View>
              <Text style={styles.todayBannerTitle}>
                Today's Scheduled Follow-Ups: {stats.today_followups} Leads
              </Text>
              <Text style={styles.todayBannerSub}>
                {showingTodayFollowupsOnly
                  ? 'Showing only today\'s follow-ups. Tap to view all leads.'
                  : 'Tap to filter and prioritize calls scheduled for today.'}
              </Text>
            </View>
          </View>
          <Text style={styles.todayBannerAction}>
            {showingTodayFollowupsOnly ? 'Show All ✕' : 'View Today ➔'}
          </Text>
        </TouchableOpacity>

        {/* 3. SEARCH & STATUS FILTER BAR */}
        <View style={styles.filterSection}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search enquiries by student name, phone, course, email..."
              placeholderTextColor={theme.colors.textMuted}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusTabsRow}>
            {STATUS_FILTERS.map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[
                  styles.statusTab,
                  selectedStatus === st.key && styles.statusTabActive,
                ]}
                onPress={() => setSelectedStatus(st.key)}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    selectedStatus === st.key && styles.statusTabTextActive,
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4. ENQUIRIES LIST */}
        <View style={styles.enquiriesSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              Enquiries List ({filteredLeads.length})
            </Text>
            <Text style={styles.listHeaderSub}>Real-time records from PostgreSQL database</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Fetching real enquiries from database...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchHrData}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredLeads.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Enquiries Found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or status filter.
              </Text>
            </View>
          ) : (
            <View style={styles.enquiryGrid}>
              {filteredLeads.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.enquiryCard}
                  onPress={() => setSelectedLead(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.enquiryCardTop}>
                    <View style={styles.enquiryTitleRow}>
                      <Text style={styles.leadIdBadge}>#{item.id}</Text>
                      <Text style={styles.leadName}>{item.name}</Text>
                      <LeadSourceBadge source={item.source} />
                    </View>
                    <LeadStatusBadge status={item.status} />
                  </View>

                  {/* Info rows */}
                  <View style={styles.enquiryDetailsGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoKey}>Course:</Text>
                      <Text style={[styles.infoVal, { color: theme.colors.primary }]}>
                        {item.course_interest || 'General Admissions'}
                      </Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.infoKey}>Phone:</Text>
                      <Text style={styles.infoVal}>{item.phone}</Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.infoKey}>Email:</Text>
                      <Text style={styles.infoVal}>{item.email || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.infoKey}>Date:</Text>
                      <Text style={styles.infoVal}>
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Follow-up / Notes snippet */}
                  {item.next_follow_up ? (
                    <View style={styles.followupNotice}>
                      <Text style={styles.followupNoticeText}>
                        📅 Scheduled Follow-Up: <Text style={{ fontWeight: '800' }}>{String(item.next_follow_up)}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {item.notes ? (
                    <View style={styles.notesSnippetBox}>
                      <Text style={styles.notesSnippetText} numberOfLines={2}>
                        💬 {item.notes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Card Action Buttons */}
                  <View style={styles.enquiryCardFooter}>
                    <View style={styles.cardActionsLeft}>
                      <TouchableOpacity
                        style={styles.cardCallBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCall(item.phone);
                        }}
                      >
                        <Text style={styles.cardCallText}>📞 Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cardWaBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(item);
                        }}
                      >
                        <Text style={styles.cardWaText}>💬 WhatsApp</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.cardOpenDetailsBtn}
                      onPress={() => setSelectedLead(item)}
                    >
                      <Text style={styles.cardOpenDetailsText}>Manage & Notes ➔</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 5. ENQUIRY DETAILS, STATUS & FOLLOW-UP MODAL */}
      <EnquiryDetailModal
        visible={Boolean(selectedLead)}
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={handleLeadUpdated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexWrap: 'wrap',
    gap: 10,
  },
  headerBadge: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    maxWidth: 560,
  },
  refreshBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  refreshBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  kpiLabel: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiNumber: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiSub: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  todayFollowupBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A78BFA',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  todayFollowupBannerActive: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
  },
  todayBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  todayBannerIcon: {
    fontSize: 26,
  },
  todayBannerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  todayBannerSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  todayBannerAction: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '800',
    paddingLeft: 10,
  },
  filterSection: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  clearSearchText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  statusTabsRow: {
    flexDirection: 'row',
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  statusTabActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  statusTabText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  statusTabTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  enquiriesSection: {
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listHeaderTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  listHeaderSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  enquiryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  enquiryCard: {
    flex: 1,
    minWidth: 300,
    maxWidth: 380,
    backgroundColor: '#121622',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e2638',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enquiryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enquiryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  leadIdBadge: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  leadName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  enquiryDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCol: {
    flex: 1,
    minWidth: 120,
  },
  infoKey: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  infoVal: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  followupNotice: {
    backgroundColor: 'rgba(167, 139, 250, 0.10)',
    borderRadius: theme.radius.xs,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.30)',
  },
  followupNoticeText: {
    color: '#A78BFA',
    fontSize: 11,
  },
  notesSnippetBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xs,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notesSnippetText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  enquiryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  cardActionsLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  cardCallBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  cardCallText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardWaBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
  },
  cardWaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardOpenDetailsBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.xs,
    ...theme.shadows.glowPrimary,
  },
  cardOpenDetailsText: {
    color: theme.colors.textDark,
    fontSize: 11,
    fontWeight: '800',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    padding: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.xs,
  },
  retryBtnText: {
    color: theme.colors.textDark,
    fontWeight: '800',
    fontSize: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});

