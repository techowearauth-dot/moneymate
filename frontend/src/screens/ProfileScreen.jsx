import React, { useState, useMemo, useContext, useCallback, useRef, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Animated, 
    StatusBar, Pressable, Alert, Dimensions,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// Design System & Contexts
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS, SPACING } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Components
import Avatar from '../components/Avatar';
import AppButton from '../components/AppButton';
import SectionHeader from '../components/SectionHeader';

const { width } = Dimensions.get('window');

// --- Internal Helper Components ---

const StatColumn = ({ value, label, showDivider, theme }) => (
    <View style={styles.statCol}>
        <View style={styles.statCenter}>
            <Text style={[styles.statValueText, { color: '#FFFFFF' }]}>{value}</Text>
            <Text style={[styles.statLabelText, { color: 'rgba(255,255,255,0.7)' }]}>{label}</Text>
        </View>
        {showDivider && <View style={[styles.vDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />}
    </View>
);

const SecurityChip = ({ icon, iconColor, label, status, statusColor, theme }) => (
    <View style={[styles.securityChip, { backgroundColor: theme.colors.background }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
        <Text style={[styles.chipLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.chipStatus, { color: statusColor }]}>{status}</Text>
    </View>
);

const QuickActionCard = ({ icon, iconBg, grad, label, onPress, theme }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    }, [scale]);

    return (
        <Pressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.flex1}
        >
            <Animated.View style={[
                styles.actionCard, 
                { backgroundColor: theme.colors.surface, transform: [{ scale }] }
            ]}>
                <View style={[styles.actionIconCircle, { backgroundColor: iconBg }]}>
                    {grad ? (
                        <LinearGradient colors={grad} style={styles.actionGradIcon}>
                            <Ionicons name={icon} size={24} color="#FFFFFF" />
                        </LinearGradient>
                    ) : (
                        <Ionicons name={icon} size={24} color={iconBg === '#ECFDF5' ? '#10B981' : '#F59E0B'} />
                    )}
                </View>
                <Text style={[styles.actionCardText, { color: theme.colors.textPrimary }]}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
};

const BarColumn = ({ day, safe, fraud, max, delay, theme }) => {
    const heightAnimSafe = useRef(new Animated.Value(0)).current;
    const heightAnimFraud = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heightAnimSafe, {
                toValue: (safe / max) * 80,
                duration: 600,
                delay: delay,
                useNativeDriver: false,
            }),
            Animated.timing(heightAnimFraud, {
                toValue: (fraud / max) * 80,
                duration: 600,
                delay: delay + 100,
                useNativeDriver: false,
            })
        ]).start();
    }, [safe, fraud, max, delay]);

    return (
        <View style={styles.barCol}>
            <View style={styles.barPair}>
                <Animated.View style={[styles.barSafe, { height: heightAnimSafe }]} />
                <Animated.View style={[styles.barFraud, { height: heightAnimFraud }]} />
            </View>
            <Text style={[styles.barLabel, { color: theme.colors.textHint }]}>{day}</Text>
        </View>
    );
};

// --- Main Screen ---

export default function ProfileScreen({ navigation }) {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const { theme, isDarkMode } = useTheme();
    const { t } = useLanguage();

    const stats = useMemo(() => ({
        scanned: 127,
        frauds: 3,
        safe: 124,
        amountSent: 24500
    }), []);

    // --- Score Calculation ---
    const securityScore = useMemo(() => {
        let score = 60;
        if (user?.twoFAEnabled) score += 15;
        if (user?.biometricsEnabled) score += 10;
        if (stats.frauds === 0) score += 10;
        if (stats.frauds <= 3) score += 5;
        return Math.min(score, 100);
    }, [user?.twoFAEnabled, user?.biometricsEnabled, stats.frauds]);

    const { scoreColor, scoreLabel, scoreIcon } = useMemo(() => {
        if (securityScore >= 80) return { scoreColor: '#10B981', scoreLabel: 'Excellent', scoreIcon: 'shield-checkmark' };
        if (securityScore >= 60) return { scoreColor: '#F59E0B', scoreLabel: 'Good', scoreIcon: 'shield-outline' };
        return { scoreColor: '#EF4444', scoreLabel: 'At Risk', scoreIcon: 'warning-outline' };
    }, [securityScore]);

    // --- Animations ---
    const scoreAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.timing(scoreAnim, {
            toValue: securityScore,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [securityScore]);

    const weekData = [
        { id: 1, day: 'Mon', safe: 18, fraud: 1 },
        { id: 2, day: 'Tue', safe: 24, fraud: 0 },
        { id: 3, day: 'Wed', safe: 15, fraud: 2 },
        { id: 4, day: 'Thu', safe: 30, fraud: 1 },
        { id: 5, day: 'Fri', safe: 22, fraud: 3 },
        { id: 6, day: 'Sat', safe: 12, fraud: 0 },
        { id: 7, day: 'Sun', safe: 20, fraud: 1 },
    ];
    const maxVal = 35;

    const handleLogout = useCallback(() => {
        Alert.alert(
            t('logout'),
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: t('logout'), 
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    }
                }
            ]
        );
    }, [logout, navigation, t]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('error'), 'Permission to access gallery is required');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            updateUserProfile({ avatar: result.assets[0].uri });
        }
    };

    const SettingChevron = ({ icon, label, value, onPress, showDivider = true }) => (
        <Pressable onPress={onPress} style={styles.settingRowWrapper}>
            <View style={styles.settingRow}>
                <View style={[styles.sIconContainer, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name={icon} size={18} color={theme.colors.primary} />
                </View>
                <Text style={[styles.sLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
                <View style={styles.sRowRight}>
                    {value && <Text style={[styles.sValue, { color: theme.colors.textSecondary }]}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textHint} />
                </View>
            </View>
            {showDivider && <View style={[styles.sDivider, { backgroundColor: theme.colors.border }]} />}
        </Pressable>
    );

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex1}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
                <StatusBar barStyle="light-content" translucent />
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    bounces={true}
                >
                    {/* SECTION 1 — PROFILE HERO HEADER */}
                    <LinearGradient colors={GRADIENTS.primary} style={styles.hero}>
                        <View style={styles.avatarGlow}>
                            <Avatar name={user?.name || 'User'} size={92} imageUri={user?.avatar} />
                            <Pressable style={styles.editAvatarBadge} onPress={handlePickImage}>
                                <Ionicons name="camera" size={10} color="#FFFFFF" />
                            </Pressable>
                        </View>

                        <View style={styles.userInfoCenter}>
                            <Text style={styles.userNameText}>{user?.name || 'Karan Sharma'}</Text>
                            <Text style={styles.userEmailText}>{user?.email || 'karan@vaultify.com'}</Text>
                            <Text style={styles.memberText}>Member since January 2024</Text>
                        </View>

                        <View style={styles.statsHeaderRow}>
                            <StatColumn value="127" label={t('scanned')} showDivider theme={theme} />
                            <StatColumn value="3" label={t('threats')} showDivider theme={theme} />
                            <StatColumn value={`₹${stats.amountSent.toLocaleString()}`} label={t('sent')} theme={theme} />
                        </View>

                        <Pressable 
                            style={styles.editProfilePill} 
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.editProfileText}>{t('editProfile')}</Text>
                        </Pressable>
                    </LinearGradient>

                    {/* SECTION 2 — SECURITY SCORE CARD */}
                    <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.scoreRow}>
                            <View>
                                <Text style={styles.scoreLabelHeader}>SECURITY SCORE</Text>
                                <View style={styles.scoreValRow}>
                                    <Text style={[styles.scoreValueBig, { color: scoreColor }]}>{securityScore}</Text>
                                    <Text style={[styles.scoreMax, { color: theme.colors.textHint }]}>/100</Text>
                                    <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '1F' }]}>
                                        <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{scoreLabel}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.scoreIconCircle, { backgroundColor: scoreColor + '1F' }]}>
                                <Ionicons name={scoreIcon} size={26} color={scoreColor} />
                            </View>
                        </View>

                        <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
                            <Animated.View style={[
                                styles.progressFill, 
                                { 
                                    backgroundColor: scoreColor,
                                    width: scoreAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]} />
                        </View>

                        <View style={styles.chipBreakdownRow}>
                            <SecurityChip icon="shield" iconColor="#4F46E5" label="2FA" status={user?.twoFAEnabled ? "On" : "Off"} statusColor={user?.twoFAEnabled ? "#10B981" : "#EF4444"} theme={theme} />
                            <SecurityChip icon="finger-print" iconColor="#7C3AED" label="Biometric" status={user?.biometricsEnabled ? "On" : "Off"} statusColor={user?.biometricsEnabled ? "#10B981" : "#EF4444"} theme={theme} />
                            <SecurityChip icon="scan" iconColor="#10B981" label="Scans" status="127 Total" statusColor={theme.colors.textPrimary} theme={theme} />
                        </View>
                    </View>

                    {/* SECTION 3 — QUICK ACTIONS ROW */}
                    <SectionHeader title="Quick Actions" style={styles.secHeader} />
                    <View style={styles.quickActionsRow}>
                        <QuickActionCard icon="arrow-up-circle" iconBg="#EEF2FF" grad={['#4F46E5','#6366F1']} label="Send Money" onPress={() => navigation.navigate('Pay')} theme={theme} />
                        <QuickActionCard icon="qr-code" iconBg="#FFFBEB" label="Scan QR" onPress={() => navigation.navigate('Scan')} theme={theme} />
                        <QuickActionCard icon="chatbubble-ellipses" iconBg="#ECFDF5" label="Scan SMS" onPress={() => navigation.navigate('Scan')} theme={theme} />
                    </View>

                    {/* SECTION 4 — ACTIVITY GRAPH */}
                    <SectionHeader title="7-Day Activity" style={styles.secHeader} />
                    <View style={[styles.graphCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.graphHeader}>
                            <Text style={[styles.graphHeaderText, { color: theme.colors.textSecondary }]}>Fraud & Safe Activity</Text>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Safe</Text>
                                <View style={[styles.legendDot, { backgroundColor: '#EF4444', marginLeft: 12 }]} />
                                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Fraud</Text>
                            </View>
                        </View>

                        <View style={styles.barContainer}>
                            {weekData.map((d, index) => (
                                <BarColumn 
                                    key={d.id} 
                                    day={d.day} 
                                    safe={d.safe} 
                                    fraud={d.fraud} 
                                    max={maxVal} 
                                    delay={index * 80} 
                                    theme={theme}
                                />
                            ))}
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryItemText, { color: '#10B981' }]}>Total Safe: 141</Text>
                            <Text style={[styles.summaryItemText, { color: '#EF4444' }]}>Total Fraud: 8</Text>
                        </View>
                    </View>

                    {/* SECTION 9 — CORE SETTINGS */}
                    <SectionHeader title={t('settings')} style={styles.secHeader} />
                    <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
                        <SettingChevron icon="settings-outline" label={t('appSettings')} onPress={() => navigation.navigate('Settings')} />
                        <SettingChevron icon="lock-closed-outline" label={t('securitySettings')} onPress={() => navigation.navigate('Settings')} />
                        <SettingChevron icon="help-circle-outline" label="Help & Support" onPress={() => navigation.navigate('HelpSupport')} showDivider={false} />
                    </View>

                    {/* LOGOUT */}
                    <View style={styles.logoutContainer}>
                        <AppButton 
                            variant="danger"
                            title={t('logout')}
                            icon="log-out-outline"
                            size="lg"
                            onPress={handleLogout}
                            style={[styles.logoutBtnStyle, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
                            textStyle={styles.logoutBtnText}
                        />
                        <View style={styles.versionContainer}>
                            <Text style={[styles.versionLabel, { color: theme.colors.textHint }]}>Vaultify v1.0.0</Text>
                            <Text style={[styles.versionSub, { color: theme.colors.textHint, opacity: 0.7 }]}>Made with ❤️ for your security</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex1: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    secHeader: { marginHorizontal: 20, marginTop: 24 },
    pHorizontal: { paddingHorizontal: 20 },
    
    // SECTION 1
    hero: {
        paddingHorizontal: 24,
        paddingTop: 52,
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        alignItems: 'center',
    },
    avatarGlow: {
        width: 104,
        height: 104,
        borderRadius: 52,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fff',
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    editAvatarBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        position: 'absolute',
        bottom: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfoCenter: { alignItems: 'center', marginTop: 14 },
    userNameText: { fontFamily: TYPOGRAPHY.fonts.heading, fontSize: 22, color: COLORS.white },
    userEmailText: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 13, color: COLORS.white, opacity: 0.75, marginTop: 3 },
    memberText: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 11, color: COLORS.white, opacity: 0.55, marginTop: 2 },
    statsHeaderRow: { flexDirection: 'row', width: '100%', marginTop: 20, justifyContent: 'space-around' },
    statCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    statCenter: { flex: 1, alignItems: 'center' },
    statValueText: { fontFamily: TYPOGRAPHY.fonts.heading, fontSize: 20 },
    statLabelText: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 11 },
    vDivider: { width: 1, height: '60%' },
    editProfilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: RADIUS.full,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        marginTop: 20,
        gap: 6,
    },
    editProfileText: { fontFamily: TYPOGRAPHY.fonts.bodySemiBold, fontSize: 13, color: '#FFFFFF' },

    // SECTION 2
    scoreCard: {
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginTop: -20,
        zIndex: 10,
        elevation: 10,
        ...SHADOWS.strong,
    },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreLabelHeader: { fontFamily: TYPOGRAPHY.fonts.bodyMedium, fontSize: 11, color: '#94A3B8', letterSpacing: 1.2 },
    scoreValRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    scoreValueBig: { fontFamily: TYPOGRAPHY.fonts.headingBold, fontSize: 32 },
    scoreMax: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 16 },
    scoreBadge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 10 },
    scoreBadgeText: { fontFamily: TYPOGRAPHY.fonts.bodySemiBold, fontSize: 12 },
    scoreIconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    progressTrack: { height: 8, borderRadius: RADIUS.full, overflow: 'hidden', marginTop: 16 },
    progressFill: { height: 8, borderRadius: RADIUS.full },
    chipBreakdownRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    securityChip: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
    chipLabel: { fontFamily: TYPOGRAPHY.fonts.bodyMedium, fontSize: 11, marginTop: 4 },
    chipStatus: { fontFamily: TYPOGRAPHY.fonts.bodyBold, fontSize: 11 },

    // SECTION 3
    quickActionsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 12 },
    actionCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', ...SHADOWS.soft, shadowOpacity: 0.05 },
    actionIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionGradIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    actionCardText: { fontFamily: TYPOGRAPHY.fonts.bodySemiBold, fontSize: 12, marginTop: 10, textAlign: 'center' },

    // SECTION 4
    graphCard: { borderRadius: 24, padding: 20, marginHorizontal: 20, marginTop: 16, ...SHADOWS.medium, shadowOpacity: 0.05 },
    graphHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    graphHeaderText: { fontFamily: TYPOGRAPHY.fonts.bodyMedium, fontSize: 13 },
    legendRow: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 11, marginLeft: 4 },
    barContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, marginBottom: 8 },
    barCol: { flex: 1, alignItems: 'center', gap: 3 },
    barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
    barSafe: { width: 8, borderRadius: 4, backgroundColor: COLORS.success },
    barFraud: { width: 8, borderRadius: 4, backgroundColor: COLORS.danger },
    barLabel: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 11, textAlign: 'center', marginTop: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 14 },
    summaryItemText: { fontFamily: TYPOGRAPHY.fonts.bodySemiBold, fontSize: 13 },

    // SETTINGS CARD
    settingsCard: { borderRadius: 24, padding: 8, marginHorizontal: 20, marginTop: 16, ...SHADOWS.medium, shadowOpacity: 0.05 },
    settingRowWrapper: { width: '100%' },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    sIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    sLabel: { flex: 1, fontFamily: TYPOGRAPHY.fonts.bodyMedium, fontSize: 14, marginLeft: 12 },
    sDivider: { height: 1, marginLeft: 64 },
    sRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sValue: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 13 },

    logoutContainer: { marginHorizontal: 20, marginTop: 24, marginBottom: 40 },
    logoutBtnStyle: { borderWidth: 1.5, borderColor: COLORS.danger, height: 54, borderRadius: 16 },
    logoutBtnText: { color: COLORS.danger, fontFamily: TYPOGRAPHY.fonts.headingSemi, fontSize: 16 },
    versionContainer: { alignItems: 'center', marginTop: 24 },
    versionLabel: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 11 },
    versionSub: { fontFamily: TYPOGRAPHY.fonts.body, fontSize: 10, marginTop: 2 },
});
