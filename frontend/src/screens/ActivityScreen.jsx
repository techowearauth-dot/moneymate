import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    TouchableOpacity, Modal, Pressable, Animated,
    Platform, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';
import { useFinance } from '../context/FinanceContext';
import smsBotService from '../services/smsBotService';

const { height } = Dimensions.get('window');
const INITIAL_LIMIT = 6;

// ─────────────────────────────────────────────────────────────
//  CAT_ICONS
// ─────────────────────────────────────────────────────────────
const CAT_ICONS = {
    shopping: { icon: 'bag-outline', color: '#8B5CF6', bg: '#F5F3FF' },
    transfer: { icon: 'swap-horizontal-outline', color: '#0EA5E9', bg: '#EFF6FF' },
    food: { icon: 'restaurant-outline', color: '#F59E0B', bg: '#FFFBEB' },
    salary: { icon: 'cash-outline', color: '#10B981', bg: '#ECFDF5' },
    travel: { icon: 'car-outline', color: '#6366F1', bg: '#EEF2FF' },
    entertainment: { icon: 'film-outline', color: '#EC4899', bg: '#FDF2F8' },
    rent: { icon: 'home-outline', color: '#14B8A6', bg: '#F0FDFA' },
    cashback: { icon: 'gift-outline', color: '#22C55E', bg: '#DCFCE7' },
    recharge: { icon: 'phone-portrait-outline', color: '#EF4444', bg: '#FEF2F2' },
    other: { icon: 'ellipsis-horizontal-outline', color: '#64748B', bg: '#F1F5F9' },
};

// ─────────────────────────────────────────────────────────────
//  DONUT CHART (Pure View — No SVG)
// ─────────────────────────────────────────────────────────────
function DonutChart({ data, size = 140, strokeWidth = 20, theme, centerLabel, centerSubLabel }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = size / 2;
    const inner = r - strokeWidth;

    const segments = [];
    let startAngle = 0;
    data.forEach((d) => {
        const angle = total > 0 ? (d.value / total) * 360 : 0;
        segments.push({ color: d.color, start: startAngle, angle });
        startAngle += angle;
    });

    if (total === 0) {
        segments.push({ color: theme.colors.surfaceAlt, start: 0, angle: 360 });
    }

    const renderArc = (seg, idx) => {
        const parts = [];
        let remaining = seg.angle;
        let current = seg.start;

        while (remaining > 0) {
            const sweep = Math.min(remaining, 180);
            parts.push(
                <View key={`${idx}-${current}`} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${current}deg` }] }]}>
                    <View style={{ width: size, height: r, overflow: 'hidden' }}>
                        <View style={{
                            width: size, height: size, borderRadius: r,
                            borderWidth: strokeWidth, borderColor: 'transparent',
                            borderTopColor: seg.color,
                            borderRightColor: sweep > 90 ? seg.color : 'transparent',
                            transform: [{ rotate: `${sweep - 90}deg` }],
                        }} />
                    </View>
                </View>
            );
            remaining -= sweep;
            current += sweep;
        }
        return parts;
    };

    return (
        <View style={S.donutWrap}>
            <View style={{ width: size, height: size, position: 'relative' }}>
                <View style={[StyleSheet.absoluteFill, {
                    borderRadius: r, borderWidth: strokeWidth,
                    borderColor: theme.colors.surfaceAlt,
                }]} />
                {segments.map((seg, i) => renderArc(seg, i))}
                <View style={[StyleSheet.absoluteFill, {
                    margin: strokeWidth,
                    borderRadius: inner,
                    backgroundColor: theme.colors.surface,
                }]} />
            </View>
            <View style={S.donutCenter}>
                <Text style={[S.donutTotal, { color: theme.colors.textPrimary }]}>{centerLabel}</Text>
                <Text style={[S.donutTotalLabel, { color: theme.colors.textHint }]}>{centerSubLabel}</Text>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
//  TRANSACTION DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function TxnDetailModal({ visible, txn, onClose, theme }) {
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, bounciness: 5, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: height, duration: 280, useNativeDriver: true }).start();
        }
    }, [visible]);

    if (!txn) return null;

    const isDebit = txn.type === 'debit' || txn.type === 'SENT';

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Pressable style={S.overlay} onPress={onClose} />
            <Animated.View style={[S.detailSheet, { backgroundColor: theme.colors.surface }, { transform: [{ translateY: slideAnim }] }]}>
                <View style={[S.handle, { backgroundColor: theme.colors.border }]} />
                <View style={S.detailHeader}>
                    <Text style={[S.detailTitle, { color: theme.colors.textPrimary }]}>Transaction Detail</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={24} color={theme.colors.textHint} /></TouchableOpacity>
                </View>
                <LinearGradient colors={isDebit ? ['#FEE2E2', '#FECACA'] : ['#DCFCE7', '#BBF7D0']} style={S.detailAmountCard}>
                    <Text style={[S.detailAmountValue, { color: isDebit ? COLORS.error : COLORS.success }]}>
                        {isDebit ? '-' : '+'}₹{(txn.amount || 0).toLocaleString()}
                    </Text>
                    <Text style={[S.detailAmountLabel, { color: isDebit ? COLORS.error : COLORS.success }]}>{isDebit ? 'Expense' : 'Income'}</Text>
                </LinearGradient>
                <View style={S.detailRow}>
                    <Text style={[S.detailRowLabel, { color: theme.colors.textHint }]}>Category</Text>
                    <Text style={[S.detailRowValue, { color: theme.colors.textPrimary }]}>{txn.category || 'Other'}</Text>
                </View>
                <View style={S.detailRow}>
                    <Text style={[S.detailRowLabel, { color: theme.colors.textHint }]}>Date</Text>
                    <Text style={[S.detailRowValue, { color: theme.colors.textPrimary }]}>{txn.date || 'Just now'}</Text>
                </View>
                <View style={S.detailRow}>
                    <Text style={[S.detailRowLabel, { color: theme.colors.textHint }]}>Note</Text>
                    <Text style={[S.detailRowValue, { color: theme.colors.textPrimary }]}>{txn.note || 'N/A'}</Text>
                </View>
                <View style={S.detailRow}>
                    <Text style={[S.detailRowLabel, { color: theme.colors.textHint }]}>ID</Text>
                    <Text style={[S.detailRowValue, { color: theme.colors.textHint, fontSize: 10 }]}>{txn.id || 'N/A'}</Text>
                </View>
            </Animated.View>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function ActivityScreen({ navigation }) {
    const { theme, isDarkMode } = useTheme();
    const { 
        netBalance, 
        totalReceived, 
        totalSpent, 
        transactions, 
        refreshTransactions,
    } = useFinance();

    const { 
        smsAnalytics, 
        triggerManualSync, 
        loading: smsLoading,
        addMessage,
        setIsFraudDetectionEnabled
    } = useSMSAnalytics();

    const [expanded, setExpanded] = useState(false);
    const [selectedTxn, setSelected] = useState(null);
    const [detailVisible, setDetail] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    // Auto Refresh logic (Keeping from previous fix)
    useEffect(() => {
        refreshTransactions();
        triggerManualSync();
    }, [refreshTransactions, triggerManualSync]);

    // ── SMS Bot Lifecycle ──
    useEffect(() => {
        if (isSimulating) {
            console.log("[ActivityScreen] Starting SMS Bot Simulation...");
            smsBotService.start(addMessage);
            setIsFraudDetectionEnabled && setIsFraudDetectionEnabled(true);
        } else {
            console.log("[ActivityScreen] Stopping SMS Bot Simulation...");
            smsBotService.stop();
            setIsFraudDetectionEnabled && setIsFraudDetectionEnabled(false);
        }
        
        return () => {
            smsBotService.stop();
            setIsFraudDetectionEnabled && setIsFraudDetectionEnabled(false);
        };
    }, [isSimulating, addMessage, setIsFraudDetectionEnabled]);

    const TRANSACTIONS = transactions || [];
    const visibleTxns = expanded ? TRANSACTIONS : TRANSACTIONS.slice(0, INITIAL_LIMIT);
    const hasMore = TRANSACTIONS.length > INITIAL_LIMIT;

    // Derived Statistics
    const totalCount = smsAnalytics?.total || 0;
    const debitCount = smsAnalytics?.debitCount || 0;
    const creditCount = smsAnalytics?.creditCount || 0;
    const otherCount = smsAnalytics?.otherCount || 0;

    const chartData = [
        { label: 'Debit', value: debitCount, color: COLORS.error, pct: totalCount > 0 ? Math.round((debitCount / totalCount) * 100) : 0 },
        { label: 'Credit', value: creditCount, color: COLORS.success, pct: totalCount > 0 ? Math.round((creditCount / totalCount) * 100) : 0 },
        { label: 'Other', value: otherCount, color: '#94A3B8', pct: totalCount > 0 ? Math.round((otherCount / totalCount) * 100) : 0 },
    ];

    const volumeTotal = totalReceived + totalSpent;
    const BANKING_LEDGER_DATA = [
        { label: 'Debit', amount: totalSpent, value: totalSpent, color: COLORS.error, pct: volumeTotal > 0 ? Math.round((totalSpent / volumeTotal) * 100) : 0 },
        { label: 'Credit', amount: totalReceived, value: totalReceived, color: COLORS.success, pct: volumeTotal > 0 ? Math.round((totalReceived / volumeTotal) * 100) : 0 },
        { label: 'Balance', amount: netBalance, value: Math.abs(netBalance), color: '#3B82F6', pct: 100 },
    ];

    const openDetail = (txn) => {
        setSelected(txn);
        setDetail(true);
    };

    return (
        <SafeAreaView style={[S.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* HEADER */}
            <View style={S.header}>
                <View>
                    <Text style={[S.headerTitle, { color: theme.colors.textPrimary }]}>Activity</Text>
                    <View style={S.simStatusRow}>
                        <View style={[S.statusDot, { backgroundColor: isSimulating ? COLORS.success : COLORS.error, width: 8, height: 8 }]} />
                        <Text style={[S.simStatusTxt, { color: theme.colors.textHint }]}>
                            {isSimulating ? 'Live Simulation Active' : 'Simulation Stopped'}
                        </Text>
                    </View>
                </View>
                <View style={S.headerRight}>
                    <TouchableOpacity 
                        onPress={() => setIsSimulating(!isSimulating)} 
                        style={[S.toggleBtn, { backgroundColor: isSimulating ? COLORS.error + '15' : COLORS.success + '15' }]}
                    >
                        <Ionicons 
                            name={isSimulating ? "stop-circle-outline" : "play-circle-outline"} 
                            size={22} 
                            color={isSimulating ? COLORS.error : COLORS.success} 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { refreshTransactions(); triggerManualSync(); }} style={S.refreshBtn}>
                        <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
                
                {/* 1. SMS ANALYSIS (DONUT STYLE) */}
                <View style={S.section}>
                    <Text style={[S.sectionTitle, { color: theme.colors.textPrimary }]}>📊 SMS Analysis</Text>
                    <View style={[S.analysisCard, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}>
                        <View style={S.chartRow}>
                            <DonutChart data={chartData} theme={theme} centerLabel={totalCount} centerSubLabel="SMS" />
                            <View style={S.chartLegend}>
                                {chartData.map((d, i) => (
                                    <View key={i} style={S.legendItem}>
                                        <View style={[S.legendDot, { backgroundColor: d.color }]} />
                                        <Text style={[S.legendPct, { color: theme.colors.textPrimary }]}>{d.pct}% {d.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={[S.analysisFooter, { borderTopColor: theme.colors.border }]}>
                            <Text style={[S.analysisFooterTxt, { color: theme.colors.textHint }]}>Based on {totalCount} recent SMS processed</Text>
                        </View>
                    </View>
                </View>

                {/* 2. BANKING LEDGER ANALYSIS (DONUT STYLE) */}
                <View style={S.section}>
                    <View style={S.sectionHeaderRow}>
                        <Text style={[S.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>🏦 Banking Ledger Analysis</Text>
                        <View style={[S.autoBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
                            <Text style={[S.autoBadgeTxt, { color: theme.colors.textHint }]}>Auto Detected</Text>
                        </View>
                    </View>
                    <View style={[S.analysisCard, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}>
                        <View style={S.chartRow}>
                            <DonutChart data={BANKING_LEDGER_DATA} theme={theme} centerLabel={`₹${Math.abs(netBalance).toLocaleString()}`} centerSubLabel="Balance" />
                            <View style={S.chartLegend}>
                                {BANKING_LEDGER_DATA.map((d, i) => (
                                    <View key={i} style={S.legendItem}>
                                        <View style={[S.legendDot, { backgroundColor: d.color, width: 8, height: 8 }]} />
                                        <View>
                                            <Text style={[S.legendPct, { color: theme.colors.textPrimary }]}>{d.pct}% {d.label}</Text>
                                            <Text style={[S.legendCount, { color: theme.colors.textHint }]}>₹{(d.amount || 0).toLocaleString()}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* 3. TRANSACTION LIST */}
                <View style={S.section}>
                    <Text style={[S.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Transactions</Text>
                    {TRANSACTIONS.length === 0 ? (
                        <View style={[S.emptyCard, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}>
                            <Text style={[S.emptyTitle, { color: theme.colors.textPrimary }]}>No activity yet</Text>
                        </View>
                    ) : (
                        <>
                            {visibleTxns.map((txn, index) => {
                                const isDebit = txn.type === 'debit' || txn.type === 'SENT';
                                return (
                                    <TouchableOpacity key={txn.id || index} onPress={() => openDetail(txn)} style={[S.txnRow, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}>
                                        <View style={S.txnInfo}>
                                            <Text style={[S.txnTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{txn.note || (isDebit ? 'Paid' : 'Received')}</Text>
                                            <Text style={[S.txnTime, { color: theme.colors.textHint }]}>{txn.date || 'Recent'}</Text>
                                        </View>
                                        <Text style={[S.txnAmount, { color: isDebit ? COLORS.error : COLORS.success }]}>
                                            {isDebit ? '-' : '+'}₹{(txn.amount || 0).toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {hasMore && (
                                <TouchableOpacity onPress={() => setExpanded(e => !e)} style={S.viewMoreBtn}>
                                    <Text style={[S.viewMoreTxt, { color: COLORS.primary }]}>{expanded ? 'Show Less' : 'View All'}</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            <TxnDetailModal visible={detailVisible} txn={selectedTxn} onClose={() => setDetail(false)} theme={theme} />
        </SafeAreaView>
    );
}

const S = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingBottom: 120 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
    headerTitle: { fontSize: 26, fontFamily: TYPOGRAPHY.fonts.headingBold },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    simStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    simStatusTxt: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    statusDot: { borderRadius: 4 },
    toggleBtn: { padding: 8, borderRadius: RADIUS.full },
    refreshBtn: { padding: 8 },
    section: { paddingHorizontal: 20, marginBottom: 18 },
    sectionTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingSemi, marginBottom: 12 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    donutWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    donutCenter: { position: 'absolute', alignItems: 'center', paddingHorizontal: 20 },
    donutTotal: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold, textAlign: 'center' },
    donutTotalLabel: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    analysisCard: { borderRadius: RADIUS.xl, padding: 20, gap: 16 },
    chartRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    chartLegend: { flex: 1, gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendPct: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    legendCount: { fontSize: 10, marginTop: 1 },
    analysisFooter: { borderTopWidth: 1, paddingTop: 12 },
    analysisFooterTxt: { fontSize: 11 },
    autoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
    autoBadgeTxt: { fontSize: 9, fontWeight: 'bold' },
    txnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: RADIUS.lg, marginBottom: 10 },
    txnInfo: { flex: 1 },
    txnTitle: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    txnTime: { fontSize: 11 },
    txnAmount: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingBold },
    viewMoreBtn: { paddingVertical: 14, alignItems: 'center' },
    viewMoreTxt: { fontSize: 13, fontWeight: 'bold' },
    emptyCard: { padding: 20, alignItems: 'center' },
    emptyTitle: { fontSize: 15 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
    detailSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    detailTitle: { fontSize: 18, fontWeight: 'bold' },
    detailAmountCard: { padding: 20, borderRadius: RADIUS.lg, alignItems: 'center', marginBottom: 20 },
    detailAmountValue: { fontSize: 24, fontWeight: 'bold' },
    detailAmountLabel: { fontSize: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    detailRowLabel: { fontSize: 13 },
    detailRowValue: { fontSize: 13, fontWeight: 'bold' }
});
