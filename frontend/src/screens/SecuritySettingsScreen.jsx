import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Switch, Platform, Alert, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { securityService } from '../services/securityService';
import { useEmergency } from '../hooks/useEmergency';
import BackButton from '../components/BackButton';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const SecurityCard = ({ children, style, theme, isDarkMode }) => (
    <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={[styles.card, { borderColor: theme.colors.border }, style, SHADOWS.soft]}>
        {children}
    </BlurView>
);

const ToggleRow = ({ icon, title, subtitle, value, onToggle, theme, color = COLORS.primary, loading = false }) => (
    <View style={styles.toggleRow}>
        <View style={[styles.iconWrap, { backgroundColor: color + '12' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.toggleContent}>
            <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
            {subtitle ? <Text style={[styles.toggleSub, { color: theme.colors.textHint }]}>{subtitle}</Text> : null}
        </View>
        <View style={styles.toggleAction}>
            {loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#E2E8F0', true: COLORS.success }}
                    thumbColor="#FFFFFF"
                    style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : {}}
                />
            )}
        </View>
    </View>
);

const DeviceItem = ({ device, onRemove, theme }) => (
    <View style={[styles.deviceItem, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.deviceIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Ionicons name={device.type === 'mobile' ? "phone-portrait-outline" : "laptop-outline"} size={18} color={theme.colors.textPrimary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.deviceName, { color: theme.colors.textPrimary }]}>{device.name || 'Unknown Device'}</Text>
            <Text style={[styles.deviceStatus, { color: device.status === 'ACTIVE' ? COLORS.success : COLORS.error }]}>
                {device.status === 'ACTIVE' ? (device.isTrusted ? 'Trusted' : 'Active Now') : 'Logged Out'}
            </Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(device.deviceId)} style={styles.removeBtn}>
            <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
    </View>
);

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────

export default function SecuritySettingsScreen() {
    const { theme, isDarkMode } = useTheme();
    const { user, updateUserProfile } = useContext(AuthContext);
    const { triggerEmergency, isTriggering } = useEmergency();

    const [loading, setLoading] = useState(true);
    const [securityData, setSecurityData] = useState({ score: 100, alerts: [], devices: [] });
    const [toggleLoading, setToggleLoading] = useState({});

    useEffect(() => {
        fetchSecurityStatus();
    }, []);

    const fetchSecurityStatus = async () => {
        try {
            const [status, devices] = await Promise.all([
                securityService.getSecurityStatus(),
                securityService.getDevices()
            ]);
            setSecurityData({
                score: status.score,
                alerts: status.alerts,
                devices: devices.devices
            });
        } catch (error) {
            console.log('[SecurityHub] Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key, value) => {
        setToggleLoading(prev => ({ ...prev, [key]: true }));
        try {
            await updateUserProfile({ [key]: value });
        } finally {
            setToggleLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleRemoveDevice = async (deviceId) => {
        Alert.alert("Remove Device", "Are you sure you want to invalidate this device session?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Remove", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await securityService.removeDevice(deviceId);
                        fetchSecurityStatus();
                    } catch (e) {
                        Alert.alert("Error", "Failed to remove device");
                    }
                } 
            }
        ]);
    };

    const handleEmergencyPress = () => {
        Alert.alert(
            "ACTIVATE EMERGENCY SOS?",
            "This will instantly share your live location and security logs with your emergency contacts.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "ACTIVATE SOS", 
                    style: "destructive", 
                    onPress: triggerEmergency 
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const score = user?.securityScore || securityData.score;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Security Hub</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textHint }]}>Manage your account safety and alerts</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* 1. Security Score Card */}
                <LinearGradient
                    colors={score > 80 ? ['#10B981', '#059669'] : score > 50 ? ['#F59E0B', '#D97706'] : ['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.scoreCard}
                >
                    <View style={styles.scoreTop}>
                        <View>
                            <Text style={styles.scoreLabel}>Security Score</Text>
                            <Text style={styles.scoreValue}>{score}%</Text>
                        </View>
                        <Ionicons name={score > 80 ? "shield-checkmark" : "shield-alert"} size={48} color="rgba(255,255,255,0.3)" />
                    </View>
                    <View style={styles.scoreProgressBg}>
                        <View style={[styles.scoreProgressFill, { width: `${score}%` }]} />
                    </View>
                    <Text style={styles.scoreStatus}>
                        {score > 80 ? 'Your account is well protected' : score > 50 ? 'Medium risk detected' : 'Critical security actions required'}
                    </Text>
                </LinearGradient>

                {/* 2. Quick Toggles */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>QUICK PROTECTION</Text>
                <SecurityCard theme={theme} isDarkMode={isDarkMode}>
                    <ToggleRow 
                        icon="shield-outline" 
                        title="SMS Fraud Detection" 
                        subtitle="Real-time scan for risky messages"
                        value={user?.smsFraudDetectionEnabled}
                        onToggle={(val) => handleToggle('smsFraudDetectionEnabled', val)}
                        loading={toggleLoading.smsFraudDetectionEnabled}
                        theme={theme}
                        color={COLORS.primary}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <ToggleRow 
                        icon="notifications-outline" 
                        title="Suspicious Activity Alerts" 
                        subtitle="Instant push for login attempts"
                        value={user?.suspiciousActivityAlertsEnabled}
                        onToggle={(val) => handleToggle('suspiciousActivityAlertsEnabled', val)}
                        loading={toggleLoading.suspiciousActivityAlertsEnabled}
                        theme={theme}
                        color={COLORS.warning}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <ToggleRow 
                        icon="eye-outline" 
                        title="Auto Transaction Monitoring" 
                        subtitle="AI analysis of your spending behavior"
                        value={user?.autoMonitoringEnabled}
                        onToggle={(val) => handleToggle('autoMonitoringEnabled', val)}
                        loading={toggleLoading.autoMonitoringEnabled}
                        theme={theme}
                        color={COLORS.success}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <ToggleRow 
                        icon="mic-outline" 
                        title="Voice Alert Detection" 
                        subtitle="Identify scam calls using AI"
                        value={user?.voiceAlertEnabled || false}
                        onToggle={(val) => handleToggle('voiceAlertEnabled', val)}
                        loading={toggleLoading.voiceAlertEnabled}
                        theme={theme}
                        color="#8B5CF6"
                    />
                </SecurityCard>

                {/* 3. Activity Monitoring */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>ACTIVITY MONITORING</Text>
                <SecurityCard theme={theme} isDarkMode={isDarkMode}>
                    <View style={styles.scanRow}>
                        <View>
                            <Text style={[styles.scanLabel, { color: theme.colors.textHint }]}>LAST SCAN</Text>
                            <Text style={[styles.scanValue, { color: theme.colors.textPrimary }]}>2 mins ago</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '15' }]}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>No suspicious activity found</Text>
                        </View>
                    </View>
                    
                    {securityData.alerts.length > 0 && (
                        <>
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            {securityData.alerts.map((alert, idx) => (
                                <View key={alert._id} style={styles.alertRowInner}>
                                    <View style={[styles.alertIconMini, { backgroundColor: alert.severity === 'high' ? COLORS.error + '15' : COLORS.warning + '15' }]}>
                                        <Ionicons name="warning" size={14} color={alert.severity === 'high' ? COLORS.error : COLORS.warning} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.alertRowTitle, { color: theme.colors.textPrimary }]}>{alert.title}</Text>
                                        <Text style={[styles.alertRowMsg, { color: theme.colors.textHint }]} numberOfLines={1}>{alert.message}</Text>
                                    </View>
                                    <Text style={[styles.alertRowTime, { color: theme.colors.textHint }]}>
                                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            ))}
                        </>
                    )}
                </SecurityCard>

                {/* 4. Trusted Devices */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>TRUSTED DEVICES</Text>
                <SecurityCard theme={theme} isDarkMode={isDarkMode}>
                    {securityData.devices.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: theme.colors.textHint }}>No active devices found.</Text>
                        </View>
                    ) : (
                        securityData.devices.map(device => (
                            <DeviceItem 
                                key={device._id} 
                                device={device}
                                theme={theme}
                                onRemove={handleRemoveDevice}
                            />
                        ))
                    )}
                </SecurityCard>

                {/* 5. Emergency Features */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>EMERGENCY FEATURES</Text>
                <View style={styles.emergencyRow}>
                    <TouchableOpacity 
                        style={[styles.emergencyBtn, { backgroundColor: COLORS.error + '15' }]}
                        onPress={handleEmergencyPress}
                        disabled={isTriggering}
                    >
                        {isTriggering ? (
                            <ActivityIndicator size="small" color={COLORS.error} />
                        ) : (
                            <>
                                <Ionicons name="medical" size={20} color={COLORS.error} />
                                <Text style={[styles.emergencyBtnTxt, { color: COLORS.error }]}>Emergency SOS</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.emergencyBtn, { backgroundColor: COLORS.warning + '15' }]}>
                        <Ionicons name="chatbubbles" size={20} color={COLORS.warning} />
                        <Text style={[styles.emergencyBtnTxt, { color: COLORS.warning }]}>Auto SMS Alert</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => triggerEmergency()} style={[styles.testBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Text style={[styles.testBtnTxt, { color: theme.colors.textPrimary }]}>Test Emergency Alert</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {/* 6. Privacy Settings */}
                <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>PRIVACY SETTINGS</Text>
                <SecurityCard theme={theme} isDarkMode={isDarkMode}>
                    <ToggleRow 
                        icon="location-outline" 
                        title="Location Sharing" 
                        subtitle="Used for location-based fraud detection"
                        value={user?.locationSharingEnabled}
                        onToggle={(val) => handleToggle('locationSharingEnabled', val)}
                        loading={toggleLoading.locationSharingEnabled}
                        theme={theme}
                        color={COLORS.primary}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.privacyRow}>
                        <View style={[styles.iconWrap, { backgroundColor: COLORS.success + '15' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.success} />
                        </View>
                        <View style={styles.toggleContent}>
                            <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>Data Encryption</Text>
                            <Text style={[styles.toggleSub, { color: theme.colors.textHint }]}>All your data is stored securely</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: COLORS.success + '20' }]}>
                            <Text style={[styles.badgeText, { color: COLORS.success }]}>ENABLED</Text>
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                    <ToggleRow 
                        icon="finger-print-outline" 
                        title="App Lock" 
                        subtitle="Require Face ID or PIN to open"
                        value={user?.appLockEnabled}
                        onToggle={(val) => handleToggle('appLockEnabled', val)}
                        loading={toggleLoading.appLockEnabled}
                        theme={theme}
                        color={COLORS.warning}
                    />
                </SecurityCard>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 15
    },
    headerText: { flex: 1 },
    title: { fontSize: 22, fontFamily: TYPOGRAPHY.fonts.headingBold },
    subtitle: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 2 },
    scrollContent: { paddingHorizontal: 20 },
    
    // Score Card
    scoreCard: {
        borderRadius: RADIUS.xl,
        padding: 24,
        marginVertical: 10,
        ...SHADOWS.medium
    },
    scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    scoreValue: { color: 'white', fontSize: 36, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 4 },
    scoreProgressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginVertical: 18, overflow: 'hidden' },
    scoreProgressFill: { height: '100%', backgroundColor: 'white', borderRadius: 4 },
    scoreStatus: { color: 'white', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // Sections
    sectionTitle: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1.2, marginTop: 25, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: RADIUS.xl, borderWidth: 1, padding: 4, overflow: 'hidden' },
    
    // Toggle Row
    toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    toggleContent: { flex: 1, marginLeft: 14 },
    toggleTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingSemi, lineHeight: 20 },
    toggleSub: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 2, opacity: 0.8 },
    toggleAction: { marginLeft: 10 },
    divider: { height: 1, marginLeft: 72, opacity: 0.3 },

    // Activity & Scan
    scanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    scanLabel: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 0.5 },
    scanValue: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6 },
    statusBadgeText: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    
    activityRow: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alertRowInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    alertIconMini: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    alertRowTitle: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    alertRowMsg: { fontSize: 11, marginTop: 1 },
    alertRowTime: { fontSize: 10, opacity: 0.6 },

    // Devices
    deviceItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
    deviceIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    deviceName: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    deviceStatus: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyMedium, marginTop: 1 },
    removeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: COLORS.error + '10' },
    removeText: { color: COLORS.error, fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // Emergency
    emergencyRow: { flexDirection: 'row', gap: 12 },
    emergencyBtn: { flex: 1, padding: 16, borderRadius: RADIUS.lg, alignItems: 'center', gap: 8 },
    emergencyBtnTxt: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: RADIUS.lg, marginTop: 15 },
    testBtnTxt: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // Privacy
    privacyRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold }
});
