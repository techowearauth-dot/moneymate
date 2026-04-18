import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Switch, Platform, Alert, Dimensions, ActivityIndicator,
    TextInput, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { paymentSettingsService } from '../services/paymentSettingsService';
import BackButton from '../components/BackButton';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const SettingsCard = ({ children, title, theme, isDarkMode }) => (
    <View style={styles.sectionContainer}>
        {title && <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>{title}</Text>}
        <BlurView intensity={isDarkMode ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={[styles.card, { borderColor: theme.colors.border }, SHADOWS.soft]}>
            {children}
        </BlurView>
    </View>
);

const PaymentMethodItem = ({ method, onSetDefault, theme }) => (
    <View style={[styles.methodItem, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.methodIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Ionicons name={method.type === 'UPI' ? "flash-outline" : "card-outline"} size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.methodTitle, { color: theme.colors.textPrimary }]}>{method.identifier}</Text>
            <Text style={[styles.methodSub, { color: theme.colors.textHint }]}>{method.provider}</Text>
        </View>
        {method.isDefault ? (
            <View style={[styles.badge, { backgroundColor: COLORS.success + '20' }]}>
                <Text style={[styles.badgeText, { color: COLORS.success }]}>DEFAULT</Text>
            </View>
        ) : (
            <TouchableOpacity onPress={() => onSetDefault(method._id)} style={styles.actionBtn}>
                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Set Default</Text>
            </TouchableOpacity>
        )}
    </View>
);

const LimitRow = ({ label, value, onEdit, theme, suffix = "" }) => (
    <View style={styles.limitRow}>
        <View style={{ flex: 1 }}>
            <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.limitValue, { color: theme.colors.textPrimary }]}>₹{value}{suffix}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} style={[styles.editBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Ionicons name="pencil" size={14} color={theme.colors.textPrimary} />
        </TouchableOpacity>
    </View>
);

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────

export default function PaymentSettingsScreen() {
    const { theme, isDarkMode } = useTheme();
    const { user, updateUserProfile } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab ] = useState('General');
    const [data, setData] = useState({ methods: [], beneficiaries: [], subscriptions: [] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [methodsRes, benRes, subRes] = await Promise.all([
                paymentSettingsService.getMethods(),
                paymentSettingsService.getBeneficiaries(),
                paymentSettingsService.getSubscriptions()
            ]);
            setData({
                methods: methodsRes.data.methods,
                beneficiaries: benRes.data.beneficiaries,
                subscriptions: subRes.data.subscriptions
            });
        } catch (error) {
            console.log('[PaymentSettings] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLimit = (key, currentVal) => {
        Alert.prompt(
            "Update Limit",
            `Enter new amount for ${key}`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Update", 
                    onPress: async (val) => {
                        const num = parseInt(val);
                        if (!isNaN(num)) {
                            // Map friendly keys to backend fields
                            const fieldMap = {
                                'Daily Spend': 'dailyLimit',
                                'Per Transaction': 'perTxnLimit',
                                'UPI Daily': 'upiLimit'
                            };
                            await paymentSettingsService.updateLimits({ [fieldMap[key]]: num });
                            updateUserProfile({ [fieldMap[key]]: num }); // Local sync
                            fetchData();
                        }
                    } 
                }
            ],
            'plain-text',
            currentVal.toString()
        );
    };

    const handleToggleSetting = async (key, val) => {
        await updateUserProfile({ [key]: val });
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Payment Settings</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textHint }]}>Secure your transactions and manage limits</Text>
                </View>
            </View>

            {/* Tab Bar Mini */}
            <View style={styles.tabBar}>
                {['General', 'Limits', 'Contacts'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tabItem, activeTab === tab && { borderBottomColor: COLORS.primary }]}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? COLORS.primary : theme.colors.textHint }]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {activeTab === 'General' && (
                    <>
                        {/* 1. Default Payment Methods */}
                        <SettingsCard title="PAYMENT METHODS" theme={theme} isDarkMode={isDarkMode}>
                            {data.methods.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={{ color: theme.colors.textHint }}>No saved methods. Add one to start.</Text>
                                </View>
                            ) : (
                                data.methods.map(method => (
                                    <PaymentMethodItem 
                                        key={method._id} 
                                        method={method} 
                                        theme={theme} 
                                        onSetDefault={async (id) => {
                                            await paymentSettingsService.setDefaultMethod(id);
                                            fetchData();
                                        }}
                                    />
                                ))
                            )}
                            <TouchableOpacity style={styles.addBtn}>
                                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                                <Text style={styles.addBtnText}>Add New Method</Text>
                            </TouchableOpacity>
                        </SettingsCard>

                        {/* 2. Authentication & Protection */}
                        <SettingsCard title="SMART PROTECTION" theme={theme} isDarkMode={isDarkMode}>
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleCol}>
                                    <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>Require PIN for Payments</Text>
                                    <Text style={styles.toggleDesc}>Verify every transaction with your security PIN</Text>
                                </View>
                                <Switch 
                                    value={user?.requirePinForPayment}
                                    onValueChange={(v) => handleToggleSetting('requirePinForPayment', v)}
                                    trackColor={{ false: '#E2E8F0', true: COLORS.success }}
                                />
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleCol}>
                                    <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>Biometric Authentication</Text>
                                    <Text style={styles.toggleDesc}>Use Face ID or Fingerprint for faster checkout</Text>
                                </View>
                                <Switch 
                                    value={user?.biometricAuthEnabled}
                                    onValueChange={(v) => handleToggleSetting('biometricAuthEnabled', v)}
                                    trackColor={{ false: '#E2E8F0', true: COLORS.success }}
                                />
                            </View>
                        </SettingsCard>

                        {/* 3. AI Smart Suggestion */}
                        <LinearGradient
                            colors={['#8B5CF6', '#6D28D9']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.aiCard}
                        >
                            <View style={styles.aiHeader}>
                                <Ionicons name="sparkles" size={18} color="white" />
                                <Text style={styles.aiLabel}>AI SMART SUGGESTION</Text>
                            </View>
                            <Text style={styles.aiText}>"You are spending 25% more via UPI than usual this week. Consider setting a lower daily limit to improve savings."</Text>
                        </LinearGradient>
                    </>
                )}

                {activeTab === 'Limits' && (
                    <>
                        <SettingsCard title="TRANSACTION LIMITS" theme={theme} isDarkMode={isDarkMode}>
                            <LimitRow label="Daily Spending Limit" value={user?.dailySpendingLimit || 50000} onEdit={() => handleUpdateLimit('Daily Spend', user?.dailySpendingLimit || 50000)} theme={theme} />
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            <LimitRow label="Per Transaction Limit" value={user?.perTransactionLimit || 10000} onEdit={() => handleUpdateLimit('Per Transaction', user?.perTransactionLimit || 10000)} theme={theme} />
                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                            <LimitRow label="UPI Daily Limit" value={user?.upiDailyLimit || 25000} onEdit={() => handleUpdateLimit('UPI Daily', user?.upiDailyLimit || 25000)} theme={theme} />
                        </SettingsCard>

                        <SettingsCard title="CATEGORY LIMITS" theme={theme} isDarkMode={isDarkMode}>
                            {['Food', 'Shopping', 'Travel', 'Entertainment'].map((cat, idx) => (
                                <React.Fragment key={cat}>
                                    <View style={styles.limitRow}>
                                        <Text style={[styles.limitLabel, { color: theme.colors.textSecondary, flex: 1 }]}>{cat}</Text>
                                        <Text style={[styles.limitValue, { color: theme.colors.textPrimary, marginRight: 15 }]}>₹{user?.categoryLimits?.[cat] || 5000}</Text>
                                        <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
                                            <Ionicons name="chevron-forward" size={14} color={theme.colors.textPrimary} />
                                        </TouchableOpacity>
                                    </View>
                                    {idx < 3 && <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />}
                                </React.Fragment>
                            ))}
                        </SettingsCard>
                    </>
                )}

                {activeTab === 'Contacts' && (
                    <SettingsCard title="SAVED BENEFICIARIES" theme={theme} isDarkMode={isDarkMode}>
                        {data.beneficiaries.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={{ color: theme.colors.textHint }}>No beneficiaries saved yet.</Text>
                            </View>
                        ) : (
                            data.beneficiaries.map(ben => (
                                <View key={ben._id} style={[styles.benRow, { borderBottomColor: theme.colors.border }]}>
                                    <View style={[styles.benAvatar, { backgroundColor: COLORS.primary + '15' }]}>
                                        <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{ben.name[0]}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.benName, { color: theme.colors.textPrimary }]}>{ben.name}</Text>
                                        <Text style={[styles.benId, { color: theme.colors.textHint }]}>{ben.upiId}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={async () => {
                                            await paymentSettingsService.toggleTrust(ben._id);
                                            fetchData();
                                        }}
                                        style={[styles.trustBtn, { backgroundColor: ben.isTrusted ? COLORS.success + '15' : theme.colors.surfaceAlt }]}
                                    >
                                        <Ionicons name={ben.isTrusted ? "checkmark-shield" : "shield-outline"} size={16} color={ben.isTrusted ? COLORS.success : theme.colors.textHint} />
                                        <Text style={[styles.trustText, { color: ben.isTrusted ? COLORS.success : theme.colors.textHint }]}>{ben.isTrusted ? 'Trusted' : 'Trust'}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        <TouchableOpacity style={styles.addBtn}>
                            <Ionicons name="person-add" size={18} color={COLORS.primary} />
                            <Text style={styles.addBtnText}>Add Beneficiary</Text>
                        </TouchableOpacity>
                    </SettingsCard>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
    headerText: { flex: 1 },
    title: { fontSize: 22, fontFamily: TYPOGRAPHY.fonts.headingBold },
    subtitle: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 2 },
    tabBar: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', marginBottom: 10 },
    tabItem: { paddingVertical: 12, marginRight: 25, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    scrollContent: { paddingHorizontal: 20 },
    sectionContainer: { marginTop: 20 },
    sectionTitle: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden' },
    divider: { height: 1.2, marginLeft: 16, opacity: 0.2 },
    emptyState: { padding: 40, alignItems: 'center' },

    // Methods
    methodItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    methodIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    methodTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    methodSub: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    actionBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    actionBtnText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
    addBtnText: { color: COLORS.primary, fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // Toggles
    toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
    toggleCol: { flex: 1 },
    toggleTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    toggleDesc: { color: COLORS.textHint, fontSize: 11, marginTop: 4, fontFamily: TYPOGRAPHY.fonts.body },

    // Limits
    limitRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    limitLabel: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    limitValue: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 4 },
    editBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    // AI Card
    aiCard: { borderRadius: RADIUS.xl, padding: 20, marginTop: 25, ...SHADOWS.soft },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    aiLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1 },
    aiText: { color: 'white', fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyMedium, lineHeight: 22 },

    // Beneficiaries
    benRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    benAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    benName: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    benId: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 2 },
    trustBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 4 },
    trustText: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold }
});
