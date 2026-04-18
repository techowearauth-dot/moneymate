import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Animated, 
    StatusBar, Easing, Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Design System & Contexts
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, SPACING, GRADIENTS } from '../constants/theme';
import { MOCK_ALERTS } from '../utils/mockData';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Components
import AppButton from '../components/AppButton';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

export default function ScanScreen() {
    const { theme, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);
    const [showResults, setShowResults] = useState(false);
    
    // Animation Values
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const startScan = () => {
        setIsScanning(true);
        setShowResults(false);
        
        // Pulse + Rotate animations
        Animated.parallel([
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ),
            Animated.loop(
                Animated.timing(rotateAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
            )
        ]).start();

        setTimeout(() => {
            setIsScanning(false);
            setShowResults(true);
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        }, 3000);
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
            
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>AI Scanner</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textHint }]}>Powered by machine learning</Text>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Scan Hero Card */}
                <View style={[styles.scanCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.radarWrapper}>
                        {/* Radar Rings */}
                        <Animated.View style={[styles.ring, styles.ringOuter, { backgroundColor: theme.colors.primaryLight, transform: [{ scale: pulseAnim }], opacity: isScanning ? 0.3 : 0.1 }]} />
                        <View style={[styles.ring, styles.ringMid, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]} />
                        
                        <LinearGradient
                            colors={GRADIENTS.primary}
                            style={styles.ringInner}
                        >
                            <Animated.View style={{ transform: [{ rotate: isScanning ? rotation : '0deg' }] }}>
                                <Ionicons name="scan" size={32} color={COLORS.white} />
                            </Animated.View>
                        </LinearGradient>
                    </View>

                    <Text style={[styles.scanTitle, { color: theme.colors.textPrimary }]}>
                        {isScanning ? 'Scanning Messages...' : 'Ready to Scan'}
                    </Text>
                    <Text style={[styles.scanDesc, { color: theme.colors.textSecondary }]}>
                        {isScanning 
                            ? 'Our AI is analyzing your SMS for potential fraud patterns and phishing links.' 
                            : 'Point at SMS or tap to scan your messages for real-time protection.'}
                    </Text>

                    <AppButton 
                        title="Scan Messages" 
                        icon="scan-outline" 
                        loading={isScanning}
                        onPress={startScan}
                        style={styles.scanBtn}
                    />
                </View>

                {showResults && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {/* Results Summary */}
                        <View style={[styles.resultsSummary, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>12</Text>
                                <Text style={styles.summaryLabel}>Total</Text>
                            </View>
                            <View style={[styles.summaryItem, styles.summaryBorder, { borderColor: theme.colors.border }]}>
                                <Text style={[styles.summaryValue, { color: theme.colors.success }]}>11</Text>
                                <Text style={styles.summaryLabel}>Safe</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: theme.colors.error }]}>1</Text>
                                <Text style={styles.summaryLabel}>Fraud</Text>
                            </View>
                        </View>

                        {/* AI Explanation Typing Effect */}
                        <View style={[styles.aiCard, { backgroundColor: theme.colors.surface }]}>
                            <LinearGradient
                                colors={GRADIENTS.accent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.aiBadge}
                            >
                                <Ionicons name="sparkles" size={12} color={COLORS.white} />
                                <Text style={styles.aiBadgeText}>AI Analysis</Text>
                            </LinearGradient>
                            
                            <Text style={[styles.aiText, { color: theme.colors.textSecondary }]}>
                                Detected 1 suspicious message from "HDFC-BANK-UPDATE". The link redirects to a non-official domain often used for credential harvesting. Security confidence: 94%.
                            </Text>

                            <View style={styles.confidenceRow}>
                                <View style={[styles.confBarBg, { backgroundColor: theme.colors.surfaceAlt }]}>
                                    <View style={[styles.confBarFill, { width: '94%' }]} />
                                </View>
                                <Text style={[styles.confValue, { color: theme.colors.primary }]}>94% Confidence</Text>
                            </View>
                        </View>

                        {/* Scanned List */}
                        <View style={styles.section}>
                            <SectionHeader title="Recent Results" />
                            {(MOCK_ALERTS || []).map((item) => (
                                <View key={item.id} style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}>
                                    <View style={styles.resultLeft}>
                                        <StatusBadge status={item.status} showIcon={false} />
                                        <Text style={[styles.resultTime, { color: theme.colors.textHint }]}>{item.time}</Text>
                                    </View>
                                    <Text style={[styles.resultMsg, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                                        {item.message}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {!showResults && !isScanning && (
                    <View style={styles.historySection}>
                        <SectionHeader title="Recent Scans" />
                        <View style={[styles.historyEmpty, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Ionicons name="time-outline" size={40} color={theme.colors.textHint} />
                            <Text style={[styles.historyEmptyText, { color: theme.colors.textHint }]}>No recent scans found</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 10,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.headingBold,
        fontSize: 24,
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 13,
        color: COLORS.textHint,
        marginTop: 2,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    scanCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 28,
        marginHorizontal: 20,
        marginTop: 20,
        padding: 28,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    radarWrapper: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
    },
    ringOuter: {
        width: 140,
        height: 140,
        backgroundColor: COLORS.primaryLight,
    },
    ringMid: {
        width: 104,
        height: 104,
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    ringInner: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },
    scanTitle: {
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontSize: 18,
        color: COLORS.textPrimary,
        marginTop: 24,
    },
    scanDesc: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    scanBtn: {
        marginTop: 28,
    },
    resultsSummary: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        padding: 16,
        ...SHADOWS.subtle,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: COLORS.border,
    },
    summaryValue: {
        fontFamily: TYPOGRAPHY.fonts.headingBold,
        fontSize: 18,
        color: COLORS.textPrimary,
    },
    summaryLabel: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 11,
        color: COLORS.textHint,
        textTransform: 'uppercase',
    },
    aiCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: 16,
        padding: 20,
        ...SHADOWS.medium,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 12,
    },
    aiBadgeText: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        fontSize: 11,
        color: COLORS.white,
    },
    aiText: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    confidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 12,
    },
    confBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: 3,
    },
    confBarFill: {
        height: '100%',
        backgroundColor: COLORS.accentCyan,
        borderRadius: 3,
    },
    confValue: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        fontSize: 12,
        color: COLORS.accentCyan,
    },
    section: {
        marginHorizontal: 20,
        marginTop: 24,
    },
    resultItem: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        ...SHADOWS.subtle,
    },
    resultLeft: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    resultTime: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 11,
        color: COLORS.textHint,
    },
    resultMsg: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    historySection: {
        marginHorizontal: 20,
        marginTop: 24,
    },
    historyEmpty: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        ...SHADOWS.subtle,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    historyEmptyText: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 14,
        color: COLORS.textHint,
        marginTop: 12,
    }
});
