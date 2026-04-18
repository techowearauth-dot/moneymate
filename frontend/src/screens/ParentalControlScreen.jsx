import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Switch,
    TextInput, TouchableOpacity, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

// Design System
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import SectionHeader from '../components/SectionHeader';
import BackButton from '../components/BackButton';

import { useFinance } from '../context/FinanceContext';

const { width, height } = Dimensions.get('window');

const CATEGORY_ICONS = {
    food: 'fast-food',
    shopping: 'cart',
    travel: 'car',
    entertainment: 'game-controller',
    education: 'book',
    health: 'heart',
    other: 'apps'
};

export default function ParentalControlScreen() {
    const { theme } = useTheme();
    const { transactions } = useFinance();
    
    // States
    const [childName, setChildName] = useState('Rahul Kumar');
    const [isActive, setIsActive] = useState(true);
    const [monthlyLimit, setMonthlyLimit] = useState('5000');
    const [usedAmount] = useState(2000);
    const [showAll, setShowAll] = useState(false);
    
    // Process transactions from ledger
    const childTransactions = React.useMemo(() => {
        return transactions.filter(t => 
            t.source === 'child' || 
            t.tag === 'child' || 
            t.note?.toLowerCase().includes('child') ||
            t.category?.toLowerCase() === 'education'
        ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }, [transactions]);

    const displayedTransactions = showAll ? childTransactions : childTransactions.slice(0, 5);

    // Restrictions
    const [restrictions, setRestrictions] = useState({
        food: true,
        entertainment: false,
        shopping: true,
        travel: true
    });

    // Alert Settings
    const [alerts, setAlerts] = useState({
        everyTransaction: true,
        limitExceeds: true,
        unusualActivity: false
    });

    const toggleRestriction = (key) => {
        setRestrictions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAlert = (key) => {
        setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const progressWidth = (usedAmount / parseInt(monthlyLimit || 1)) * 100;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerRow}>
                <BackButton />
                <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Parental Control</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Manage and monitor child expenses</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* 1. Child Profile Card */}
                <Animated.View entering={FadeInDown.delay(100)}>
                    <GlassCard style={styles.profileCard}>
                        <View style={styles.profileInfo}>
                            <View style={[styles.avatarContainer, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="person" size={32} color="#6366F1" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <TextInput
                                    style={[styles.nameInput, { color: theme.colors.textPrimary }]}
                                    value={childName}
                                    onChangeText={setChildName}
                                    placeholder="Child Name"
                                />
                                <Text style={[styles.ageText, { color: theme.colors.textHint }]}>Age: 14 Years</Text>
                            </View>
                            <View style={styles.statusToggle}>
                                <Text style={[styles.statusText, { color: isActive ? '#10B981' : theme.colors.textHint }]}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </Text>
                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                                    thumbColor="#FFF"
                                />
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* 2. Spending Limit */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                    <SectionHeader title="Spending Limit" />
                    <GlassCard style={styles.limitCard}>
                        <View style={styles.limitInputRow}>
                            <Text style={[styles.limitLabel, { color: theme.colors.textSecondary }]}>Set Monthly Limit</Text>
                            <View style={[styles.limitInputBox, { backgroundColor: theme.colors.surfaceAlt }]}>
                                <Text style={[styles.currency, { color: theme.colors.textPrimary }]}>₹</Text>
                                <TextInput
                                    style={[styles.limitInput, { color: theme.colors.textPrimary }]}
                                    value={monthlyLimit}
                                    onChangeText={setMonthlyLimit}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.progressHeader}>
                            <Text style={[styles.progressText, { color: theme.colors.textHint }]}>Used: ₹{usedAmount}</Text>
                            <Text style={[styles.progressText, { color: theme.colors.textHint }]}>Limit: ₹{monthlyLimit}</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceAlt }]}>
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBarFill, { width: `${Math.min(progressWidth, 100)}%` }]}
                            />
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* 3. Category Restrictions */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                    <SectionHeader title="Category Restrictions" />
                    <GlassCard style={styles.restrictionCard}>
                        <RestrictionItem 
                            label="Food" 
                            icon="fast-food-outline" 
                            value={restrictions.food} 
                            onToggle={() => toggleRestriction('food')}
                            theme={theme}
                        />
                        <RestrictionItem 
                            label="Entertainment" 
                            icon="game-controller-outline" 
                            value={restrictions.entertainment} 
                            onToggle={() => toggleRestriction('entertainment')}
                            theme={theme}
                        />
                        <RestrictionItem 
                            label="Shopping" 
                            icon="cart-outline" 
                            value={restrictions.shopping} 
                            onToggle={() => toggleRestriction('shopping')}
                            theme={theme}
                        />
                        <RestrictionItem 
                            label="Travel" 
                            icon="car-outline" 
                            value={restrictions.travel} 
                            onToggle={() => toggleRestriction('travel')}
                            theme={theme}
                        />
                    </GlassCard>
                </Animated.View>

                {/* 4. Alert Settings */}
                <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                    <SectionHeader title="Alert Settings" />
                    <GlassCard style={styles.alertCard}>
                        <AlertItem 
                            label="Notify on every transaction" 
                            value={alerts.everyTransaction} 
                            onToggle={() => toggleAlert('everyTransaction')}
                            theme={theme}
                        />
                        <AlertItem 
                            label="Notify when limit exceeds" 
                            value={alerts.limitExceeds} 
                            onToggle={() => toggleAlert('limitExceeds')}
                            theme={theme}
                        />
                        <AlertItem 
                            label="Notify unusual activity" 
                            value={alerts.unusualActivity} 
                            onToggle={() => toggleAlert('unusualActivity')}
                            theme={theme}
                        />
                    </GlassCard>
                </Animated.View>

                {/* 5. Recent Activity */}
                <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
                    <SectionHeader title="Recent Child Activity" />
                    <GlassCard style={styles.activityCard}>
                        <Animated.View layout={Layout.springify()}>
                            {childTransactions.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="receipt-outline" size={32} color={theme.colors.textHint} />
                                    <Text style={[styles.emptyText, { color: theme.colors.textHint }]}>No activity yet</Text>
                                </View>
                            ) : (
                                displayedTransactions.map((item, index) => {
                                    const isDebit = item.type === 'debit' || item.type === 'SENT';
                                    const catKey = item.category?.toLowerCase() || 'other';
                                    const iconName = CATEGORY_ICONS[catKey] || 'apps';
                                    
                                    return (
                                        <Animated.View 
                                            key={item.id || index} 
                                            entering={FadeInDown}
                                            style={[styles.activityItem, index === 0 && { borderTopWidth: 0 }]}
                                        >
                                            <View style={[styles.activityIconWrap, { backgroundColor: isDebit ? '#FEE2E2' : '#DCFCE7' }]}>
                                                <Ionicons name={iconName} size={18} color={isDebit ? '#EF4444' : '#10B981'} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]}>
                                                    {isDebit ? 'Spent' : 'Received'} ₹{Math.abs(item.amount).toLocaleString()} on {item.category || 'Other'}
                                                </Text>
                                                <Text style={[styles.activityTime, { color: theme.colors.textHint }]}>
                                                    {item.note || 'No note'} • {new Date(item.timestamp || Date.now()).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.activityAmt, { color: isDebit ? '#EF4444' : '#10B981' }]}>
                                                {isDebit ? '-' : '+'}₹{Math.abs(item.amount)}
                                            </Text>
                                        </Animated.View>
                                    );
                                })
                            )}
                        </Animated.View>

                        {childTransactions.length > 5 && (
                            <TouchableOpacity 
                                style={[styles.viewMoreBtn, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]}
                                onPress={() => setShowAll(!showAll)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.viewMoreTxt, { color: theme.colors.primary }]}>
                                    {showAll ? 'Show Less' : `View More (${childTransactions.length - 5} more)`}
                                </Text>
                                <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.primary} style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* 6. Action Buttons */}
                <Animated.View entering={FadeInUp.delay(600)} style={styles.actionSection}>
                    <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: isActive ? '#EF4444' : '#10B981' }]} activeOpacity={0.8}>
                        <Ionicons name={isActive ? "lock-closed-outline" : "lock-open-outline"} size={20} color="#FFF" />
                        <Text style={styles.mainActionBtnText}>
                            {isActive ? 'Disable Parental Control' : 'Enable Parental Control'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.resetBtn} activeOpacity={0.7}>
                        <Text style={[styles.resetBtnText, { color: theme.colors.textSecondary }]}>Reset Limits</Text>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
}

const RestrictionItem = ({ label, icon, value, onToggle, theme }) => (
    <View style={styles.rowItem}>
        <View style={styles.rowLabelGroup}>
            <View style={[styles.rowIcon, { backgroundColor: value ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons name={icon} size={18} color={value ? '#10B981' : '#EF4444'} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
        </View>
        <View style={styles.rowActions}>
            <Text style={[styles.statusPill, { color: value ? '#10B981' : '#EF4444', backgroundColor: value ? '#DCFCE7' : '#FEE2E2' }]}>
                {value ? 'Allowed' : 'Restricted'}
            </Text>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#EF4444', true: '#10B981' }}
                thumbColor="#FFF"
            />
        </View>
    </View>
);

const AlertItem = ({ label, value, onToggle, theme }) => (
    <View style={styles.rowItem}>
        <Text style={[styles.alertLabel, { color: theme.colors.textPrimary, flex: 1 }]}>{label}</Text>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#CBD5E1', true: '#6366F1' }}
            thumbColor="#FFF"
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        fontFamily: TYPOGRAPHY.fonts.body,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    section: {
        marginTop: 24,
    },
    profileCard: {
        padding: 20,
        borderRadius: 24,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameInput: {
        fontSize: 18,
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontWeight: '700',
        padding: 0,
    },
    ageText: {
        fontSize: 12,
        marginTop: 2,
    },
    statusToggle: {
        alignItems: 'flex-end',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
    },
    limitCard: {
        padding: 20,
        borderRadius: 24,
    },
    limitInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    limitLabel: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.body,
        fontWeight: '600',
    },
    limitInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 44,
        borderRadius: 12,
        minWidth: 100,
    },
    currency: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 4,
    },
    limitInput: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 11,
        fontFamily: TYPOGRAPHY.fonts.body,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    restrictionCard: {
        paddingVertical: 10,
        borderRadius: 24,
    },
    alertCard: {
        paddingVertical: 10,
        borderRadius: 24,
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    rowLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowLabel: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.body,
    },
    rowActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusPill: {
        fontSize: 10,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    alertLabel: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.body,
    },
    activityCard: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    activityIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityTitle: {
        fontSize: 13,
        fontFamily: TYPOGRAPHY.fonts.body,
        fontWeight: '600',
    },
    activityTime: {
        fontSize: 11,
        marginTop: 2,
    },
    activityAmt: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontWeight: '700',
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.body,
    },
    viewMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    viewMoreTxt: {
        fontSize: 13,
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
    },
    actionSection: {
        marginTop: 32,
        alignItems: 'center',
        gap: 16,
    },
    mainActionBtn: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        ...SHADOWS.medium,
    },
    mainActionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontWeight: '700',
    },
    resetBtn: {
        paddingVertical: 8,
    },
    resetBtnText: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.body,
        fontWeight: '700',
        textDecorationLine: 'underline',
    }
});
