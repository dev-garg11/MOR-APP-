import React, { useEffect, useMemo, useState } from 'react';
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
import { createFeePayment, listPendingFees } from '../../services/endpoints';
import { theme } from '../../theme';

export function FeeManagerScreen() {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Card Detail / Payment Modal State
  const [selectedFeeRecord, setSelectedFeeRecord] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  const loadPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listPendingFees();
      setPendingList(res.data || []);
    } catch (err) {
      setError(err.message || 'Could not load fee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pendingList;
    return pendingList.filter((item) => {
      return (
        item.student_name.toLowerCase().includes(q) ||
        (item.phone && item.phone.includes(q)) ||
        (item.course && item.course.toLowerCase().includes(q))
      );
    });
  }, [pendingList, searchQuery]);

  const handleOpenDetail = (item) => {
    setSelectedFeeRecord(item);
    setPayAmount(String(item.pending_amount || ''));
    setPayMode('UPI');
    setPayNotes('');
    setPayError('');
    setPaySuccess('');
  };

  const handleRecordPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }

    setPayLoading(true);
    setPayError('');
    setPaySuccess('');

    try {
      await createFeePayment({
        student_id: selectedFeeRecord.student_id,
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        notes: payNotes || `Fee installment recorded by Admin (${payMode})`,
      });

      setPaySuccess(`✓ ₹${parseFloat(payAmount).toLocaleString()} payment recorded successfully!`);
      setTimeout(() => {
        setSelectedFeeRecord(null);
        loadPending();
      }, 1200);
    } catch (err) {
      setPayError(err.message || 'Failed to record fee payment.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleWhatsAppReminder = (item) => {
    const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
    const p = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hi ${item.student_name}, this is a gentle reminder from Morphy Academy Accounts regarding your pending fee installment of ₹${Number(item.pending_amount || 0).toLocaleString()} (Due: ${item.fee_due_date || 'Soon'}). Please clear at your earliest.`;
    Linking.openURL(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`);
  };

  const totalPendingBalance = pendingList.reduce(
    (acc, curr) => acc + Number(curr.pending_amount || 0),
    0
  );
  const overdueCount = pendingList.filter((i) => i.fee_status === 'overdue').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>ACCOUNTS & DUES</Text>
          <Text style={styles.headerTitle}>Fee Management & Recovery</Text>
          <Text style={styles.headerSubtitle}>
            Track upcoming installments, overdue balances, and record offline receipts.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadPending}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>PENDING ACCOUNTS</Text>
          <Text style={styles.kpiVal}>{pendingList.length}</Text>
          <Text style={styles.kpiSub}>Students with dues</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TOTAL RECOVERY DUE</Text>
          <Text style={[styles.kpiVal, { color: '#EF4444' }]}>
            ₹{totalPendingBalance.toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>Outstanding amount</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>OVERDUE INSTALLMENTS</Text>
          <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{overdueCount}</Text>
          <Text style={styles.kpiSub}>Immediate attention</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, phone, course..."
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

      {/* Content List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading fee schedules...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPending}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>All fees are cleared!</Text>
          <Text style={styles.emptySubtitle}>No pending or overdue student installments.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countText}>
            Showing {filteredList.length} of {pendingList.length} fee accounts
          </Text>

          {/* Fee Cards Grid (Responsive Cards) */}
          <View style={styles.cardsGrid}>
            {filteredList.map((item) => {
              const total = Number(item.fees_total || 0);
              const paid = Number(item.fees_paid || 0);
              const pending = Number(item.pending_amount || 0);
              const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
              const isOverdue = item.fee_status === 'overdue';
              const initials = item.student_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              return (
                <TouchableOpacity
                  key={item.student_id}
                  style={[styles.feeCard, isOverdue && styles.feeCardOverdue]}
                  onPress={() => handleOpenDetail(item)}
                  activeOpacity={0.85}
                >
                  {/* Top Bar with Avatar & Status */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isOverdue && { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isOverdue && { color: '#EF4444' },
                        ]}
                      >
                        {initials || 'ST'}
                      </Text>
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {item.student_name}
                      </Text>
                      <Text style={styles.studentPhone}>📞 {item.phone}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isOverdue
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                          borderColor: isOverdue ? '#EF4444' : '#F59E0B',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isOverdue ? '#EF4444' : '#F59E0B' },
                        ]}
                      >
                        {isOverdue ? '⚠️ OVERDUE' : '⏳ PENDING'}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar (% Paid) */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>PAYMENT PROGRESS</Text>
                      <Text style={styles.progressVal}>{percentPaid}% PAID</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${percentPaid}%`, backgroundColor: '#22C55E' },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Financial Grid */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>TOTAL</Text>
                      <Text style={styles.metricVal}>₹{total.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>PAID</Text>
                      <Text style={[styles.metricVal, { color: '#22C55E' }]}>
                        ₹{paid.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>DUE</Text>
                      <Text style={[styles.metricVal, { color: '#EF4444' }]}>
                        ₹{pending.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {item.fee_due_date ? (
                    <Text style={styles.dueDateText}>📅 Due Date: {item.fee_due_date}</Text>
                  ) : null}

                  {/* Action Bar */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.waIconBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleWhatsAppReminder(item);
                      }}
                    >
                      <Text style={styles.waIconBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.recordPayBtn}
                      onPress={() => handleOpenDetail(item)}
                    >
                      <Text style={styles.recordPayBtnText}>View & Pay ➔</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* Record Payment / Fee Detail Modal */}
      {selectedFeeRecord ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedFeeRecord(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalBadge}>FEE LEDGER & RECEIPT ENTRY</Text>
                  <Text style={styles.modalTitle}>{selectedFeeRecord.student_name}</Text>
                  <Text style={styles.modalSub}>📞 {selectedFeeRecord.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedFeeRecord(null)}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Financial Summary Card */}
                <View style={styles.modalSummaryBox}>
                  <View style={styles.modalMetricCol}>
                    <Text style={styles.modalMetricLabel}>TOTAL FEE</Text>
                    <Text style={styles.modalMetricVal}>
                      ₹{Number(selectedFeeRecord.fees_total || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalMetricCol}>
                    <Text style={styles.modalMetricLabel}>TOTAL PAID</Text>
                    <Text style={[styles.modalMetricVal, { color: '#22C55E' }]}>
                      ₹{Number(selectedFeeRecord.fees_paid || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalMetricCol}>
                    <Text style={styles.modalMetricLabel}>BALANCE DUE</Text>
                    <Text style={[styles.modalMetricVal, { color: '#EF4444' }]}>
                      ₹{Number(selectedFeeRecord.pending_amount || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {paySuccess ? (
                  <View style={styles.successBanner}>
                    <Text style={styles.successBannerText}>{paySuccess}</Text>
                  </View>
                ) : null}

                {payError ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{payError}</Text>
                  </View>
                ) : null}

                {/* Payment Form */}
                <View style={styles.modalForm}>
                  <Text style={styles.inputLabel}>Amount to Record (₹)*</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter amount"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={payAmount}
                    onChangeText={setPayAmount}
                  />

                  <Text style={styles.inputLabel}>Payment Mode</Text>
                  <View style={styles.modeRow}>
                    {['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Card'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.modeBtn, payMode === m && styles.modeBtnActive]}
                        onPress={() => setPayMode(m)}
                      >
                        <Text
                          style={[
                            styles.modeBtnText,
                            payMode === m && styles.modeBtnTextActive,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Receipt Notes / Transaction ID</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. GPay UPI Ref 9384729103"
                    placeholderTextColor="#64748B"
                    value={payNotes}
                    onChangeText={setPayNotes}
                  />

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setSelectedFeeRecord(null)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleRecordPayment}
                      disabled={payLoading}
                    >
                      {payLoading ? (
                        <ActivityIndicator color="#000000" />
                      ) : (
                        <Text style={styles.submitBtnText}>✓ Save Payment Receipt</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
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
  refreshBtn: {
    backgroundColor: '#1a2030',
    paddingHorizontal: 14,
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
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#121622',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiVal: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 22,
    marginTop: 16,
    backgroundColor: '#121622',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1e2638',
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
  /* Responsive Fee Cards Grid */
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  feeCard: {
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
  feeCardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '900',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  studentPhone: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressVal: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#0c0f17',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0c0f17',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e2638',
    marginVertical: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dueDateText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2638',
  },
  waIconBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  waIconBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  recordPayBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  recordPayBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#121622',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#2c364d',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalBadge: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#64748B',
    fontSize: 20,
  },
  modalSummaryBox: {
    flexDirection: 'row',
    backgroundColor: '#0c0f17',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e2638',
    marginBottom: 16,
  },
  modalMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  modalMetricLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalMetricVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  modalForm: {
    gap: 10,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  modeBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1a2030',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c364d',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
  },
  successBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginBottom: 10,
  },
  successBannerText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 10,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
