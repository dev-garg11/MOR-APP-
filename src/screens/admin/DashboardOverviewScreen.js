import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDashboardOverview, listLeads } from '../../services/endpoints';
import { theme } from '../../theme';
import { normalizeSource } from '../../utils/leadSourceDetector';

export function DashboardOverviewScreen({ onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [leadSourceStats, setLeadSourceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, leadsRes] = await Promise.all([
        getDashboardOverview(),
        listLeads(),
      ]);

      setOverview(ovRes.data || {});

      // Calculate Lead Sources breakdown
      const allLeads = leadsRes.data || [];
      const counts = {
        instagram: 0,
        youtube: 0,
        google_ads: 0,
        whatsapp: 0,
        website_direct: 0,
        referral: 0,
      };

      allLeads.forEach((l) => {
        const src = normalizeSource(l.source);
        if (counts[src] !== undefined) {
          counts[src] += 1;
        } else {
          counts.website_direct += 1;
        }
      });

      setLeadSourceStats(counts);
    } catch (err) {
      setError(err.message || 'Could not load executive metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Morphy Academy Analytics…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totals = overview?.totals || {};
  const totalLeadsCount = totals.leads || 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>EXECUTIVE DASHBOARD</Text>
          <Text style={styles.headerTitle}>Morphy Academy Control Center</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderColor: theme.colors.primary }]}>
          <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.primary }]}>
            ₹{Number(totals.fees_paid || 0).toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>Fees collected to date</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: theme.colors.accentCyan }]}>
          <Text style={styles.kpiLabel}>ACTIVE STUDENTS</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.accentCyan }]}>
            {totals.students || 0}
          </Text>
          <Text style={styles.kpiSub}>Enrolled across all batches</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: theme.colors.accentPurple }]}>
          <Text style={styles.kpiLabel}>TOTAL LEADS</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.accentPurple }]}>
            {totalLeadsCount}
          </Text>
          <Text style={styles.kpiSub}>Inquiries captured</Text>
        </View>

        <View style={[styles.kpiCard, { borderColor: theme.colors.danger }]}>
          <Text style={styles.kpiLabel}>PENDING DUES</Text>
          <Text style={[styles.kpiValue, { color: theme.colors.danger }]}>
            ₹{Number(totals.fees_pending || 0).toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>{totals.overdue_students || 0} overdue students</Text>
        </View>
      </View>

      {/* Lead Acquisition Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionBadge}>MARKETING ATTRIBUTION</Text>
            <Text style={styles.sectionTitle}>Lead Acquisition Channels</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('leads')}>
            <Text style={styles.linkText}>View CRM Pipeline ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.channelGrid}>
          <View style={styles.channelCard}>
            <View style={styles.channelHeader}>
              <Text style={styles.channelIcon}>📷</Text>
              <Text style={[styles.channelName, { color: theme.colors.sourceInstagram }]}>
                Instagram
              </Text>
            </View>
            <Text style={styles.channelCount}>{leadSourceStats.instagram || 0}</Text>
            <Text style={styles.channelPct}>
              {totalLeadsCount > 0
                ? `${Math.round(((leadSourceStats.instagram || 0) / totalLeadsCount) * 100)}%`
                : '0%'}
            </Text>
          </View>

          <View style={styles.channelCard}>
            <View style={styles.channelHeader}>
              <Text style={styles.channelIcon}>▶️</Text>
              <Text style={[styles.channelName, { color: theme.colors.sourceYouTube }]}>
                YouTube
              </Text>
            </View>
            <Text style={styles.channelCount}>{leadSourceStats.youtube || 0}</Text>
            <Text style={styles.channelPct}>
              {totalLeadsCount > 0
                ? `${Math.round(((leadSourceStats.youtube || 0) / totalLeadsCount) * 100)}%`
                : '0%'}
            </Text>
          </View>

          <View style={styles.channelCard}>
            <View style={styles.channelHeader}>
              <Text style={styles.channelIcon}>🔍</Text>
              <Text style={[styles.channelName, { color: theme.colors.sourceGoogle }]}>
                Google Ads
              </Text>
            </View>
            <Text style={styles.channelCount}>{leadSourceStats.google_ads || 0}</Text>
            <Text style={styles.channelPct}>
              {totalLeadsCount > 0
                ? `${Math.round(((leadSourceStats.google_ads || 0) / totalLeadsCount) * 100)}%`
                : '0%'}
            </Text>
          </View>

          <View style={styles.channelCard}>
            <View style={styles.channelHeader}>
              <Text style={styles.channelIcon}>💬</Text>
              <Text style={[styles.channelName, { color: theme.colors.sourceWhatsApp }]}>
                WhatsApp
              </Text>
            </View>
            <Text style={styles.channelCount}>{leadSourceStats.whatsapp || 0}</Text>
            <Text style={styles.channelPct}>
              {totalLeadsCount > 0
                ? `${Math.round(((leadSourceStats.whatsapp || 0) / totalLeadsCount) * 100)}%`
                : '0%'}
            </Text>
          </View>

          <View style={styles.channelCard}>
            <View style={styles.channelHeader}>
              <Text style={styles.channelIcon}>🌐</Text>
              <Text style={[styles.channelName, { color: theme.colors.textSecondary }]}>
                Website Direct
              </Text>
            </View>
            <Text style={styles.channelCount}>{leadSourceStats.website_direct || 0}</Text>
            <Text style={styles.channelPct}>
              {totalLeadsCount > 0
                ? `${Math.round(((leadSourceStats.website_direct || 0) / totalLeadsCount) * 100)}%`
                : '0%'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Navigation */}
      <View style={styles.quickNavSection}>
        <Text style={styles.quickNavTitle}>Quick Operations</Text>
        <View style={styles.quickNavGrid}>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => onNavigate('leads')}
          >
            <Text style={styles.quickNavIcon}>🎯</Text>
            <Text style={styles.quickNavBtnText}>Lead CRM</Text>
            <Text style={styles.quickNavSub}>Follow-ups & Admissions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => onNavigate('students')}
          >
            <Text style={styles.quickNavIcon}>🎓</Text>
            <Text style={styles.quickNavBtnText}>Students Directory</Text>
            <Text style={styles.quickNavSub}>Credentials & Batches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => onNavigate('fees')}
          >
            <Text style={styles.quickNavIcon}>💳</Text>
            <Text style={styles.quickNavBtnText}>Fee Management</Text>
            <Text style={styles.quickNavSub}>Receipts & Overdue Dues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => onNavigate('attendance')}
          >
            <Text style={styles.quickNavIcon}>📅</Text>
            <Text style={styles.quickNavBtnText}>Attendance Sheet</Text>
            <Text style={styles.quickNavSub}>Trainer Daily Checklist</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    alignItems: 'center',
    marginBottom: 20,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    ...theme.shadows.sm,
  },
  kpiLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  kpiSub: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionBadge: {
    color: theme.colors.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  channelCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  channelIcon: {
    fontSize: 14,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '700',
  },
  channelCount: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  channelPct: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  quickNavSection: {
    marginBottom: 30,
  },
  quickNavTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickNavBtn: {
    flex: 1,
    minWidth: 150,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  quickNavIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickNavBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  quickNavSub: {
    color: theme.colors.textMuted,
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
});

