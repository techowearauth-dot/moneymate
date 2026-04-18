import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    TouchableOpacity, Modal, Pressable,
    Platform, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    FadeInDown, 
    FadeInUp,
    Layout,
    interpolateColor
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';
import { useFinance } from '../context/FinanceContext';
import smsBotService from '../services/smsBotService';
import GlassCard from '../components/GlassCard';

const { width, height } = Dimensions.get('window');
const INITIAL_LIMIT = 5;

// ─────────────────────────────────────────────────────────────
//  COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Animated Number for count-up effect */
const AnimatedNumber = ({ value, style }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        let start = displayValue;
        const end = parseInt(value);
        if (start === end) return;
        
        let totalDuration = 800;
        let frameDuration = 1000 / 60;
        let totalFrames = Math.round(totalDuration / frameDuration);
        let currentFrame = 0;
        
        const animate = () => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            const current = Math.round(start + (end - start) * progress);
            setDisplayValue(current);
            
            if (currentFrame < totalFrames) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }, [value]);
    
    return <Text style={style}>{displayValue.toLocaleString()}</Text>;
};

/** Glowing Ring Chart */
function GlowingRingChart({ data, size = 160, strokeWidth = 12, centerLabel, centerSubLabel }) {
    const { isDarkMode } = useTheme();
    const total = data.reduce((s, d) => s + d.value, 0);
    
    return (
        <View style={[styles.ringContainer, { width: size, height: size }]}>
            {/* Background Track */}
            <View style={[styles.ringTrack, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]} />
            
            {/* Legend Circles (Simplified for UI elegance) */}
            <View style={styles.ringCenter}>
                <AnimatedNumber value={centerLabel} style={styles.centerValue} />
                <Text style={styles.centerLabel}>{centerSubLabel}</Text>
            </View>

            {/* Glowing Arcs (Visual representation) */}
            <View style={StyleSheet.absoluteFill}>
                {data.map((item, idx) => {
                    if (item.value === 0) return null;
                    const pct = total > 0 ? (item.value / total) : 0;
                    return (
                        <View key={idx} style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${idx * 120}deg` }] }]}>
                             {/* Mock Arcs with Gradients */}
                             <LinearGradient 
                                colors={[item.color, item.color + '50']} 
                                style={[styles.ringArc, { width: size, height: size, borderRadius: size/2, borderWidth: strokeWidth, borderColor: item.color, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', opacity: 0.8 }]}
                             />
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
//  TRANSACTION DETAIL MODAL (Redesigned)
// ─────────────────────────────────────────────────────────────
function TxnDetailModal({ visible, txn, onClose, theme }) {
    if (!txn) return null;
    const isDebit = txn.type === 'debit' || txn.type === 'SENT';

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Details</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color={theme.colors.textHint} />
                        </TouchableOpacity>
                    </View>

                    <LinearGradient 
                        colors={isDebit ? ['#FF4D4D', '#FF8080'] : ['#00C853', '#64DD17']} 
                        style={styles.modalHero}
                    >
                        <Text style={styles.modalAmt}>₹{(txn.amount || 0).toLocaleString()}</Text>
                        <Text style={styles.modalStatus}>{isDebit ? 'Payment Out' : 'Payment In'}</Text>
                    </LinearGradient>

                    <View style={styles.modalInfoList}>
                        <DetailRow label="Category" value={txn.category || 'Other'} icon="apps-outline" color="#6366F1" theme={theme} />
                        <DetailRow label="Date" value={txn.date || 'Today'} icon="calendar-outline" color="#0EA5E9" theme={theme} />
                        <DetailRow label="Note" value={txn.note || 'No description'} icon="document-text-outline" color="#F59E0B" theme={theme} />
                        <DetailRow label="Reference" value={txn.id?.slice(0, 12) || 'N/A'} icon="id-card-outline" color="#94A3B8" theme={theme} last />
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const DetailRow = ({ label, value, icon, color, theme, last }) => (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
        <View style={[styles.detailIconBox, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.detailRowLabel, { color: theme.colors.textHint }]}>{label}</Text>
            <Text style={[styles.detailRowValue, { color: theme.colors.textPrimary }]}>{value}</Text>
        </View>
    </View>
);

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

    useEffect(() => {
        refreshTransactions();
        triggerManualSync();
    }, [refreshTransactions, triggerManualSync]);

    useEffect(() => {
        if (isSimulating) {
            smsBotService.start(addMessage);
            setIsFraudDetectionEnabled?.(true);
        } else {
            smsBotService.stop();
            setIsFraudDetectionEnabled?.(false);
        }
        return () => smsBotService.stop();
    }, [isSimulating, addMessage, setIsFraudDetectionEnabled]);

    const TRANSACTIONS = transactions || [];
    const visibleTxns = expanded ? TRANSACTIONS : TRANSACTIONS.slice(0, INITIAL_LIMIT);
    const hasMore = TRANSACTIONS.length > INITIAL_LIMIT;

    // Derived Statistics
    const totalCount = smsAnalytics?.total || 0;
    const debitCount = smsAnalytics?.debitCount || 0;
    const creditCount = smsAnalytics?.creditCount || 0;
    const otherCount = smsAnalytics?.otherCount || 0;

    const volumeTotal = totalReceived + totalSpent;
    const ledgerChartData = [
        { label: 'Spending', value: totalSpent, color: '#F43F5E', pct: volumeTotal > 0 ? Math.round((totalSpent / volumeTotal) * 100) : 0 },
        { label: 'Income', value: totalReceived, color: '#10B981', pct: volumeTotal > 0 ? Math.round((totalReceived / volumeTotal) * 100) : 0 }
    ];

    const chartData = [
        { label: 'Debit', value: debitCount, color: '#F43F5E', pct: totalCount > 0 ? Math.round((debitCount / totalCount) * 100) : 0 },
        { label: 'Credit', value: creditCount, color: '#10B981', pct: totalCount > 0 ? Math.round((creditCount / totalCount) * 100) : 0 },
        { label: 'Other', value: otherCount, color: '#6366F1', pct: totalCount > 0 ? Math.round((otherCount / totalCount) * 100) : 0 },
    ];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            
            {/* Futuristic Header */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                <View>
                    <Text style={[styles.headerSubtitle, { color: '#6366F1' }]}>FINANCIAL INTELLIGENCE</Text>
                    <Text style={[styles.headerTitle, { color: '#111827' }]}>Activity</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        onPress={() => setIsSimulating(!isSimulating)}
                        style={[styles.simBadge, { backgroundColor: isSimulating ? '#10B98115' : '#F43F5E15' }]}
                    >
                        <View style={[styles.statusPulse, { backgroundColor: isSimulating ? '#10B981' : '#F43F5E' }]} />
                        <Text style={[styles.simText, { color: isSimulating ? '#10B981' : '#F43F5E' }]}>
                            {isSimulating ? 'LIVE' : 'SIM'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => refreshTransactions()} style={styles.glassBtn}>
                        <Ionicons name="reload" size={20} color="#6366F1" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* 1. LEDGER HERO CARD (Vibrant Gradient) */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.heroCard}>
                        <View style={styles.heroHeader}>
                            <Text style={styles.heroLabel}>Net Balance</Text>
                            <View style={[styles.heroBadge, { backgroundColor: '#FFFFFF30' }]}>
                                <Text style={[styles.heroBadgeText, { color: '#FFF' }]}>AI PROCESSED</Text>
                            </View>
                        </View>
                        
                        <View style={styles.heroMain}>
                            <View style={styles.heroBalanceWrap}>
                                <Text style={[styles.currencyPrefix, { color: '#FFF' }]}>₹</Text>
                                <AnimatedNumber value={Math.abs(netBalance)} style={styles.heroBalance} />
                            </View>
                        </View>

                        <View style={styles.heroGrid}>
                            <View style={styles.heroGridItem}>
                                <View style={[styles.gridIcon, { backgroundColor: '#FFFFFF20' }]}>
                                    <Ionicons name="arrow-down-circle" size={18} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={styles.gridLabel}>RECEIVED</Text>
                                    <Text style={[styles.gridValue, { color: '#FFF' }]}>₹{totalReceived.toLocaleString()}</Text>
                                </View>
                            </View>
                            <View style={styles.heroGridItem}>
                                <View style={[styles.gridIcon, { backgroundColor: '#FFFFFF20' }]}>
                                    <Ionicons name="arrow-up-circle" size={18} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={styles.gridLabel}>SPENT</Text>
                                    <Text style={[styles.gridValue, { color: '#FFF' }]}>₹{totalSpent.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* 2. SMS ANALYSIS SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#111827' }]}>SMS Intelligence</Text>
                    <TouchableOpacity onPress={() => triggerManualSync()}><Text style={styles.actionLink}>Sync Now</Text></TouchableOpacity>
                </View>

                <Animated.View entering={FadeInDown.delay(400)}>
                     <View style={[styles.analysisCard, { backgroundColor: '#F9FAFB' }]}>
                        <View style={styles.analysisRow}>
                            <GlowingRingChart 
                                data={chartData} 
                                centerLabel={totalCount} 
                                centerSubLabel="MESSAGES" 
                            />
                            <View style={styles.legendContainer}>
                                {chartData.map((item, i) => (
                                    <View key={i} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.legendLabel, { color: '#4B5563' }]}>{item.label}</Text>
                                            <View style={[styles.legendFillBg, { backgroundColor: '#E5E7EB' }]}>
                                                <Animated.View style={[styles.legendFill, { backgroundColor: item.color, width: `${item.pct}%` }]} />
                                            </View>
                                        </View>
                                        <Text style={[styles.legendPct, { color: '#111827' }]}>{item.pct}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        {totalCount === 0 && (
                             <Text style={styles.emptyMsg}>No SMS data yet 📩</Text>
                        )}
                     </View>
                </Animated.View>

                {/* 3. VAULT INTELLIGENCE */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#111827' }]}>Vault Intelligence</Text>
                    <View style={[styles.autoBadge, { backgroundColor: '#6366F115' }]}>
                        <Text style={[styles.autoBadgeTxt, { color: '#6366F1' }]}>LEDGER DATA</Text>
                    </View>
                </View>

                <Animated.View entering={FadeInDown.delay(500)}>
                     <View style={[styles.analysisCard, { backgroundColor: '#F9FAFB' }]}>
                        <View style={styles.analysisRow}>
                            <GlowingRingChart 
                                data={ledgerChartData} 
                                centerLabel={`₹${Math.abs(netBalance).toLocaleString()}`} 
                                centerSubLabel="BALANCE" 
                            />
                            <View style={styles.legendContainer}>
                                {[
                                    { label: 'Spending', amount: totalSpent, color: '#F43F5E', pct: volumeTotal > 0 ? Math.round((totalSpent / volumeTotal) * 100) : 0 },
                                    { label: 'Income', amount: totalReceived, color: '#10B981', pct: volumeTotal > 0 ? Math.round((totalReceived / volumeTotal) * 100) : 0 }
                                ].map((item, i) => (
                                    <View key={i} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <Text style={[styles.legendLabel, { color: '#4B5563' }]}>{item.label}</Text>
                                                <Text style={[styles.legendLabel, { fontSize: 10, color: '#6B7280' }]}>₹{item.amount.toLocaleString()}</Text>
                                            </View>
                                            <View style={[styles.legendFillBg, { backgroundColor: '#E5E7EB' }]}>
                                                <Animated.View style={[styles.legendFill, { backgroundColor: item.color, width: `${item.pct}%` }]} />
                                            </View>
                                        </View>
                                        <Text style={[styles.legendPct, { color: '#111827' }]}>{item.pct}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                     </View>
                </Animated.View>

                {/* 4. RECENT TRANSACTIONS */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: '#111827' }]}>Live Activity</Text>
                    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                        <Text style={styles.actionLink}>{expanded ? 'Show Less' : 'View All'}</Text>
                    </TouchableOpacity>
                </View>

                <Animated.View layout={Layout.springify()}>
                    {TRANSACTIONS.length === 0 ? (
                        <View style={styles.emptyContainer}>
                             <Ionicons name="rocket-outline" size={48} color="#E5E7EB" />
                             <Text style={[styles.emptyTitle, { color: '#6B7280' }]}>Start tracking your activity 🚀</Text>
                             <Text style={styles.emptySub}>Transactions will appear here automatically</Text>
                        </View>
                    ) : (
                        visibleTxns.map((txn, index) => {
                            const isDebit = txn.type === 'debit' || txn.type === 'SENT';
                            return (
                                <Animated.View key={txn.id || index} entering={FadeInDown.delay(index * 50)}>
                                    <TouchableOpacity 
                                        onPress={() => openDetail(txn)} 
                                        style={[styles.txnCard, { backgroundColor: '#FFFFFF' }]}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.txnIconBox, { backgroundColor: isDebit ? '#F43F5E10' : '#10B98110' }]}>
                                            <Ionicons 
                                                name={isDebit ? "arrow-up" : "arrow-down"} 
                                                size={18} 
                                                color={isDebit ? '#F43F5E' : '#10B981'} 
                                            />
                                        </View>
                                        <View style={styles.txnInfo}>
                                            <Text style={[styles.txnTitle, { color: '#111827' }]} numberOfLines={1}>{txn.note || (isDebit ? 'Payment Out' : 'Payment In')}</Text>
                                            <Text style={[styles.txnDate, { color: '#6B7280' }]}>{txn.date || 'Recent'}</Text>
                                        </View>
                                        <Text style={[styles.txnAmt, { color: isDebit ? '#F43F5E' : '#10B981' }]}>
                                            {isDebit ? '-' : '+'}₹{(txn.amount || 0).toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })
                    )}
                </Animated.View>

            </ScrollView>

            <TxnDetailModal visible={detailVisible} txn={selectedTxn} onClose={() => setDetail(false)} theme={theme} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingBottom: 100, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
    headerTitle: { fontSize: 32, fontFamily: TYPOGRAPHY.fonts.headingBold },
    headerSubtitle: { fontSize: 10, letterSpacing: 1.5, fontFamily: TYPOGRAPHY.fonts.headingBold, marginBottom: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    simBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
    statusPulse: { width: 6, height: 6, borderRadius: 3 },
    simText: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.headingBold },
    glassBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    
    heroCard: { borderRadius: 30, padding: 24, ...SHADOWS.medium, overflow: 'hidden' },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { color: '#E0E7FF', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    heroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    heroBadgeText: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    heroMain: { marginVertical: 20 },
    heroBalanceWrap: { flexDirection: 'row', alignItems: 'baseline' },
    currencyPrefix: { fontSize: 24, fontFamily: TYPOGRAPHY.fonts.headingBold, marginRight: 4, opacity: 0.8 },
    heroBalance: { color: '#FFF', fontSize: 42, fontFamily: TYPOGRAPHY.fonts.headingBold },
    heroGrid: { flexDirection: 'row', gap: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
    heroGridItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    gridIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    gridLabel: { color: '#E0E7FF', fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    gridValue: { color: '#FFF', fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 1 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold },
    actionLink: { fontSize: 13, color: '#6366F1', fontFamily: TYPOGRAPHY.fonts.bodyBold },

    analysisCard: { padding: 20, borderRadius: 24, ...SHADOWS.soft },
    analysisRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    ringContainer: { justifyContent: 'center', alignItems: 'center' },
    ringTrack: { position: 'absolute' },
    ringCenter: { alignItems: 'center' },
    centerValue: { fontSize: 24, fontFamily: TYPOGRAPHY.fonts.headingBold, color: '#111827' },
    centerLabel: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.headingBold, letterSpacing: 1, color: '#6B7280' },
    ringArc: { position: 'absolute' },

    legendContainer: { flex: 1, gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    legendFillBg: { height: 4, borderRadius: 2, marginTop: 4 },
    legendFill: { height: '100%', borderRadius: 2 },
    legendPct: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.headingBold },
    emptyMsg: { textAlign: 'center', marginTop: 16, color: '#94A3B8', fontSize: 12 },

    txnCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, ...SHADOWS.small },
    txnIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    txnInfo: { flex: 1, marginLeft: 16 },
    txnTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    txnDate: { fontSize: 12, marginTop: 2 },
    txnAmt: { fontSize: 16, fontFamily: TYPOGRAPHY.fonts.headingBold },

    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 16 },
    emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, paddingHorizontal: 20 },
    modalHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 2.5, alignSelf: 'center', marginVertical: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold },
    modalHero: { padding: 32, borderRadius: 24, alignItems: 'center', marginBottom: 24, gap: 4 },
    modalAmt: { fontSize: 42, color: '#FFF', fontFamily: TYPOGRAPHY.fonts.headingBold },
    modalStatus: { color: '#FFFFFFCC', fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    modalInfoList: { gap: 4 },
    detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    detailIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    detailRowLabel: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    detailRowValue: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.bodyBold, marginTop: 1 },
    autoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    autoBadgeTxt: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold }
});
