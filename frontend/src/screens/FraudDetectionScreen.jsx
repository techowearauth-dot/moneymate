import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList,
    Dimensions, TouchableOpacity, Animated, Platform,
    StatusBar, ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const StatCard = ({ title, value, icon, color, theme, isDarkMode }) => (
    <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={[styles.statCard, { borderColor: theme.colors.border }, SHADOWS.soft]}>
        <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.statInfo}>
            <Text style={[styles.statTitle, { color: theme.colors.textHint }]}>{title}</Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
        </View>
    </BlurView>
);

const TransactionItem = ({ item, theme }) => {
    const isHigh = item.riskLevel === 'HIGH';
    const isMed = item.riskLevel === 'MEDIUM';
    const riskColor = isHigh ? COLORS.error : isMed ? '#F59E0B' : COLORS.success;

    return (
        <View style={[styles.txnItem, { borderBottomColor: theme.colors.border }]}>
            <View style={[styles.txnDot, { backgroundColor: riskColor }]} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.txnMerchant, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {item.merchant || item.note || 'Unknown'}
                </Text>
                <Text style={[styles.txnTime, { color: theme.colors.textHint }]}>
                    {new Date(item.date || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txnAmount, { color: (isHigh || isMed) ? riskColor : theme.colors.textPrimary }]}>
                    ₹{(item.amount || 0).toLocaleString()}
                </Text>
                <View style={[styles.riskBadge, { backgroundColor: riskColor + '15' }]}>
                    <Text style={[styles.riskText, { color: riskColor }]}>
                        {item.riskLevel || 'SAFE'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const AlertItem = ({ item, theme, isDarkMode }) => {
    const isHigh = item.riskLevel === 'HIGH';
    const alertColor = isHigh ? COLORS.error : '#F59E0B';

    return (
        <BlurView intensity={isDarkMode ? 30 : 60} tint={isDarkMode ? 'dark' : 'light'} style={[styles.alertItem, { borderColor: alertColor + '40' }]}>
            <View style={styles.alertHeader}>
                <Ionicons name={isHigh ? "shield-alert" : "warning"} size={16} color={alertColor} />
                <Text style={[styles.alertTitle, { color: alertColor }]}>
                    {isHigh ? 'Critical Security Alert' : 'Unusual Activity'}
                </Text>
            </View>
            <Text style={[styles.alertMsg, { color: theme.colors.textPrimary }]}>
                {item.message || "Potential risk detected with this transaction."}
            </Text>
            <View style={styles.alertFooter}>
                <Text style={[styles.alertMeta, { color: theme.colors.textHint }]}>
                    ₹{item.amount.toLocaleString()} • {item.merchant}
                </Text>
            </View>
        </BlurView>
    );
};

// ─────────────────────────────────────────────────────────────
//  GRAPH VIEW (SVG Network Visualization)
// ─────────────────────────────────────────────────────────────
const NetworkGraph = ({ data, theme, isDarkMode }) => {
    const centerX = 150;
    const centerY = 110;
    const radius = 75;

    const nodes = useMemo(() => {
        return data.slice(0, 5).map((txn, i) => {
            const angle = (i / 5) * 2 * Math.PI;
            return {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                label: (txn.merchant || 'Unk').split(' ')[0],
                riskLevel: txn.riskLevel || 'LOW'
            };
        });
    }, [data]);

    return (
        <View style={styles.graphContainer}>
            <Svg height="220" width="300">
                {/* Connections */}
                {nodes.map((node, i) => (
                    <Line
                        key={`line-${i}`}
                        x1={centerX} y1={centerY}
                        x2={node.x} y2={node.y}
                        stroke={node.riskLevel === 'HIGH' ? COLORS.error + '60' :
                            node.riskLevel === 'MEDIUM' ? '#F59E0B60' :
                                isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                        strokeWidth="1.5"
                        strokeDasharray={node.riskLevel !== 'LOW' ? "0" : "4,4"}
                    />
                ))}

                {/* Center Node */}
                <Circle cx={centerX} cy={centerY} r="18" fill={COLORS.primary} />
                <SvgText x={centerX} y={centerY + 4} fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">USER</SvgText>

                {/* Outer Nodes */}
                {nodes.map((node, i) => {
                    const nodeColor = node.riskLevel === 'HIGH' ? COLORS.error :
                        node.riskLevel === 'MEDIUM' ? '#F59E0B' :
                            COLORS.success;
                    return (
                        <G key={`node-${i}`}>
                            <Circle cx={node.x} cy={node.y} r="12" fill={nodeColor + '20'} stroke={nodeColor} strokeWidth="1" />
                            <SvgText x={node.x} y={node.y + 18} fontSize="7" fill={theme.colors.textHint} textAnchor="middle">{node.label}</SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────

export default function FraudDetectionScreen() {
    const navigation = useNavigation();
    const { theme, isDarkMode } = useTheme();
    const {
        smsAnalytics,
        fraudAlerts,
        isFraudDetectionEnabled
    } = useSMSAnalytics();

    const transactions = useMemo(() => (smsAnalytics?.messages || []).slice(0, 10), [smsAnalytics]);

    // Calculate Stats
    const stats = useMemo(() => {
        const total = smsAnalytics?.total || 0;
        const highRiskCount = (smsAnalytics?.messages || []).filter(m => m.riskLevel === 'HIGH').length;
        const medRiskCount = (smsAnalytics?.messages || []).filter(m => m.riskLevel === 'MEDIUM').length;
        const fraudAmount = (smsAnalytics?.messages || []).reduce((acc, m) => (m.riskLevel === 'HIGH' || m.riskLevel === 'MEDIUM') ? acc + (m.amount || 0) : acc, 0);
        const avgRisk = total > 0 ? ((highRiskCount + medRiskCount) / total * 100).toFixed(1) : '0';

        return {
            total,
            fraudCount: highRiskCount + medRiskCount,
            amount: fraudAmount > 1000 ? (fraudAmount / 1000).toFixed(1) + 'k' : fraudAmount,
            risk: avgRisk + '%'
        };
    }, [smsAnalytics]);

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.canGoBack() && navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Security Hub</Text>
                        <View style={styles.subtextRow}>
                            <View style={[styles.statusDot, { backgroundColor: isFraudDetectionEnabled ? COLORS.success : COLORS.error, width: 6, height: 6 }]} />
                            <Text style={[styles.headerSub, { color: theme.colors.textHint }]}>
                                {isFraudDetectionEnabled ? 'AI Monitoring Active' : 'System Inactive'}
                            </Text>
                        </View>
                    </View>
                </View>
                {isFraudDetectionEnabled && (
                    <View style={[styles.liveBadge, { backgroundColor: COLORS.success + '15' }]}>
                        <View style={styles.pulseDot} />
                        <Text style={[styles.liveText, { color: COLORS.success }]}>LIVE SCAN</Text>
                    </View>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* 1. TOP SECTION: Stats */}
                <View style={styles.topSection}>
                    <View style={styles.statsRow}>
                        <StatCard theme={theme} isDarkMode={isDarkMode} title="Transactions" value={stats.total} icon="shield-check-outline" color={COLORS.primary} />
                        <StatCard theme={theme} isDarkMode={isDarkMode} title="Risk Found" value={stats.fraudCount} icon="bug-outline" color={COLORS.error} />
                    </View>
                    <View style={styles.statsRow}>
                        <StatCard theme={theme} isDarkMode={isDarkMode} title="Flagged Vol" value={`₹${stats.amount}`} icon="wallet-outline" color={COLORS.warning} />
                        <StatCard theme={theme} isDarkMode={isDarkMode} title="Security Score" value={stats.risk} icon="analytics-outline" color={COLORS.success} />
                    </View>
                </View>

                {!isFraudDetectionEnabled ? (
                    <View style={styles.inactiveContainer}>
                        <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={styles.inactiveCard}>
                            <Ionicons name="shield-off-outline" size={60} color={theme.colors.textHint} />
                            <Text style={[styles.inactiveTitle, { color: theme.colors.textPrimary }]}>Fraud Detection Inactive</Text>
                            <Text style={[styles.inactiveSub, { color: theme.colors.textHint }]}>
                                Start the SMS Bot in the Activity page to enable real-time fraud monitoring and network analysis.
                            </Text>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                onPress={() => navigation.navigate('Activity')}
                            >
                                <Text style={styles.actionBtnTxt}>Enable Now</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </View>
                ) : (
                    <>
                        {/* 2. MIDDLE SECTION: Two Columns */}
                        <View style={styles.middleSection}>
                            {/* Left: Live Transactions */}
                            <View style={[styles.middleCol, { marginRight: 6 }]}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="pulse" size={14} color={COLORS.primary} />
                                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>LIVE FEED</Text>
                                </View>
                                <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={[styles.tableContainer, { borderColor: theme.colors.border }]}>
                                    {transactions.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Text style={{ color: theme.colors.textHint, fontSize: 10 }}>Listening...</Text>
                                        </View>
                                    ) : (
                                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
                                            {transactions.map((item, idx) => (
                                                <TransactionItem key={item.id || idx} item={item} theme={theme} />
                                            ))}
                                        </ScrollView>
                                    )}
                                </BlurView>
                            </View>

                            {/* Right: Alerts Panel */}
                            <View style={[styles.middleCol, { marginLeft: 6 }]}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                                    <Text style={[styles.sectionTitle, { color: COLORS.error }]}>CRITICAL ALERTS</Text>
                                </View>
                                <View style={styles.alertsContainer}>
                                    {fraudAlerts.length === 0 ? (
                                        <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={[styles.tableContainer, styles.emptyState, { borderColor: theme.colors.border }]}>
                                            <Text style={{ color: theme.colors.textHint, fontSize: 10 }}>No threats detected</Text>
                                        </BlurView>
                                    ) : (
                                        <ScrollView showsVerticalScrollIndicator={false}>
                                            {fraudAlerts.map((alert, i) => <AlertItem key={alert.id || i} item={alert} theme={theme} isDarkMode={isDarkMode} />)}
                                        </ScrollView>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* 3. BOTTOM SECTION: GraphView */}
                        <View style={styles.bottomSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="git-network-outline" size={14} color={theme.colors.textHint} />
                                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>NETWORK VISUALIZATION</Text>
                            </View>
                            <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={[styles.graphWrap, { borderColor: theme.colors.border }]}>
                                <NetworkGraph data={transactions} theme={theme} isDarkMode={isDarkMode} />
                            </BlurView>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    titleContainer: { justifyContent: 'center' },
    headerTitle: { fontSize: 22, fontFamily: TYPOGRAPHY.fonts.headingBold },
    subtextRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    headerSub: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: RADIUS.full, gap: 6,
    },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
    liveText: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 0.5 },

    // Stats
    topSection: { paddingHorizontal: 14, paddingBottom: 10 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statCard: {
        flex: 1, margin: 6, padding: 14, borderRadius: RADIUS.xl,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, overflow: 'hidden'
    },
    statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statInfo: { flex: 1 },
    statTitle: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold, textTransform: 'uppercase' },
    statValue: { fontSize: 17, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 1 },

    // Middle
    middleSection: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, height: 320 },
    middleCol: { flex: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingLeft: 4 },
    sectionTitle: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1.2 },
    tableContainer: { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
    alertsContainer: { flex: 1 },
    emptyState: { justifyContent: 'center', alignItems: 'center', padding: 20 },

    // Txn Item
    txnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, gap: 10 },
    txnDot: { width: 4, height: 4, borderRadius: 2 },
    txnMerchant: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    txnTime: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 1 },
    txnAmount: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.headingBold },
    riskBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginTop: 3 },
    riskText: { fontSize: 7, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // Alert Item
    alertItem: { padding: 12, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
    alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    alertTitle: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    alertMsg: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.body, lineHeight: 14 },
    alertFooter: { marginTop: 6, opacity: 0.8 },
    alertMeta: { fontSize: 8, fontFamily: TYPOGRAPHY.fonts.body },

    // Bottom
    bottomSection: { paddingHorizontal: 20, marginBottom: 20 },
    graphWrap: { height: 240, borderRadius: RADIUS.xl, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    graphContainer: { width: 300, height: 220, justifyContent: 'center', alignItems: 'center' },

    // Inactive
    inactiveContainer: { paddingHorizontal: 20, marginTop: 20 },
    inactiveCard: { padding: 40, borderRadius: RADIUS.xl, alignItems: 'center', gap: 16, borderWidth: 1, overflow: 'hidden' },
    inactiveTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold },
    inactiveSub: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.body, textAlign: 'center', lineHeight: 20 },
    actionBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: RADIUS.full, marginTop: 10 },
    actionBtnTxt: { color: 'white', fontFamily: TYPOGRAPHY.fonts.bodyBold, fontSize: 14 }
});
