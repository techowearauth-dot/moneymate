import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Dimensions, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown, FadeInUp, ZoomIn, 
    useSharedValue, useAnimatedStyle, withSpring, withDelay
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';

// Design & Context
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { paymentService } from '../services/paymentService';
import GlassCard from '../components/GlassCard';

const { width } = Dimensions.get('window');

export default function PaymentReceiptScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    const { refreshTransactions } = useFinance();
    const { transaction } = route.params || {};

    const [actionLoading, setActionLoading] = useState(null);
    const [actionDone, setActionDone] = useState({});

    // Animations
    const checkScale = useSharedValue(0);
    const cardScale = useSharedValue(0.9);

    useEffect(() => {
        checkScale.value = withDelay(300, withSpring(1, { damping: 12 }));
        cardScale.value = withDelay(500, withSpring(1));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const animatedCheckStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }]
    }));

    const handleAction = async (type, amount, note) => {
        try {
            setActionLoading(type);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const res = await paymentService.addTransaction({
                amount,
                type: 'debit',
                category: type,
                note: note || `Payment ${type}`,
                source: 'system'
            });

            if (res.success) {
                setActionDone(prev => ({ ...prev, [type]: true }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await refreshTransactions();
            }
        } catch (e) {
            console.error(`[Receipt Action] ${type} failed:`, e);
        } finally {
            setActionLoading(null);
        }
    };

    if (!transaction) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
                <Text style={{ color: theme.colors.textPrimary, textAlign: 'center' }}>No transaction data found.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Drawer')}>
                    <Text style={{ color: theme.colors.primary, textAlign: 'center', marginTop: 20 }}>Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* -- Success Animation & Header -- */}
                <View style={styles.header}>
                    <Animated.View style={[styles.checkCircle, animatedCheckStyle]}>
                        <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.checkGradient}>
                            <Ionicons name="checkmark" size={60} color="#FFF" />
                        </LinearGradient>
                    </Animated.View>
                    <Animated.Text entering={FadeInUp.delay(600)} style={[styles.statusTitle, { color: theme.colors.textPrimary }]}>
                        Payment Successful
                    </Animated.Text>
                    <Animated.Text entering={FadeInUp.delay(700)} style={[styles.statusSubtitle, { color: theme.colors.textHint }]}>
                        Your transaction has been processed securely.
                    </Animated.Text>
                </View>

                {/* -- Receipt Card -- */}
                <Animated.View entering={FadeInDown.delay(800)} style={styles.cardContainer}>
                    <GlassCard style={styles.receiptCard}>
                        <View style={styles.amountWrap}>
                            <Text style={[styles.currency, { color: theme.colors.textPrimary }]}>₹</Text>
                            <Text style={[styles.amountValue, { color: theme.colors.textPrimary }]}>
                                {transaction.amount.toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsList}>
                            <DetailRow label="Paid to" value={transaction.recipientName || transaction.upiId} icon="person-outline" theme={theme} />
                            <DetailRow label="UPI ID" value={transaction.upiId} icon="at-outline" theme={theme} />
                            <DetailRow 
                                label="Category" 
                                value={transaction.category?.toUpperCase() || 'OTHER'} 
                                icon="grid-outline" 
                                theme={theme}
                                isHighlight={true}
                            />
                            <DetailRow label="Note" value={transaction.note || 'None'} icon="document-text-outline" theme={theme} />
                            <DetailRow label="Date & Time" value={new Date().toLocaleString()} icon="time-outline" theme={theme} />
                            <DetailRow label="Order ID" value={transaction.orderId || 'N/A'} icon="barcode-outline" theme={theme} />
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* -- Post-Payment Micro-Actions -- */}
                <Animated.View entering={FadeInDown.delay(1000)} style={styles.actionsSection}>
                    <Text style={[styles.actionsTitle, { color: theme.colors.textPrimary }]}>Maximize your money</Text>
                    
                    <View style={styles.actionGrid}>
                        {/* Save Money */}
                        <ActionItem 
                            icon="leaf-outline"
                            title="Save Spare"
                            subtitle="Save ₹50 to Vault"
                            color="#3B82F6"
                            isLoading={actionLoading === 'saving'}
                            isDone={actionDone['saving']}
                            onPress={() => handleAction('saving', 50, 'Smart Savings')}
                            theme={theme}
                        />

                        {/* Donate */}
                        <ActionItem 
                            icon="heart-outline"
                            title="Donate"
                            subtitle="Gift ₹20 to NGO"
                            color="#EC4899"
                            isLoading={actionLoading === 'donation'}
                            isDone={actionDone['donation']}
                            onPress={() => handleAction('donation', 20, 'Charity Donation')}
                            theme={theme}
                        />

                        {/* Invest */}
                        <ActionItem 
                            icon="trending-up-outline"
                            title="Invest"
                            subtitle="Buy index funds"
                            color="#F59E0B"
                            onPress={() => navigation.navigate('Drawer', { screen: 'Stocks' })}
                            theme={theme}
                        />
                    </View>
                </Animated.View>

                <TouchableOpacity 
                    style={[styles.doneButton, { backgroundColor: theme.colors.surfaceAlt }]}
                    onPress={() => navigation.navigate('Drawer')}
                >
                    <Text style={[styles.doneButtonText, { color: theme.colors.textPrimary }]}>Done</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({ label, value, icon, theme, isHighlight }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
                <Ionicons name={icon} size={14} color={theme.colors.textHint} />
                <Text style={[styles.detailLabel, { color: theme.colors.textHint }]}>{label}</Text>
            </View>
            <Text style={[
                styles.detailValue, 
                { color: theme.colors.textPrimary },
                isHighlight && { color: theme.colors.primary, fontWeight: '700' }
            ]}>
                {value}
            </Text>
        </View>
    );
}

function ActionItem({ icon, title, subtitle, color, onPress, isLoading, isDone, theme }) {
    return (
        <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
            onPress={isDone ? null : onPress}
            disabled={isLoading || isDone}
        >
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.actionTitleText, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.actionSubtitle, { color: theme.colors.textHint }]}>{subtitle}</Text>
            
            {isLoading ? (
                <ActivityIndicator size="small" color={color} style={styles.actionStatus} />
            ) : isDone ? (
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={styles.actionStatus} />
            ) : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
    checkCircle: { width: 100, height: 100, borderRadius: 50, elevation: 10, ...Platform.select({ ios: { shadowColor: '#22C55E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 } }) },
    checkGradient: { flex: 1, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    statusTitle: { fontSize: 24, fontWeight: '700', marginTop: 24 },
    statusSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
    cardContainer: { paddingHorizontal: 20, marginTop: 40 },
    receiptCard: { padding: 24, borderRadius: 32 },
    amountWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 20 },
    currency: { fontSize: 24, fontWeight: '600', marginRight: 4 },
    amountValue: { fontSize: 48, fontWeight: '800' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
    detailsList: { gap: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailLabel: { fontSize: 12, fontWeight: '500' },
    detailValue: { fontSize: 14, fontWeight: '600' },
    actionsSection: { marginTop: 40, paddingHorizontal: 20 },
    actionsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    actionGrid: { flexDirection: 'row', gap: 12 },
    actionCard: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitleText: { fontSize: 13, fontWeight: '700' },
    actionSubtitle: { fontSize: 10, textAlign: 'center', marginTop: 4 },
    actionStatus: { marginTop: 8 },
    doneButton: { marginHorizontal: 20, marginTop: 40, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    doneButtonText: { fontSize: 16, fontWeight: '700' }
});
