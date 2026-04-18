import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    StatusBar, Pressable, KeyboardAvoidingView,
    Platform, TextInput, Dimensions, TouchableOpacity,
    ActivityIndicator, Image, FlatList, Linking, Alert, Modal, AppState 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown, FadeInUp, Layout,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
    FadeIn, ZoomIn
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';

// Design System & Contexts
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, SPACING, GRADIENTS } from '../constants/theme';
import {
    MOCK_ACCOUNTS, MOCK_CONTACTS, MOCK_REWARDS,
    MOCK_ALERTS, MOCK_BILLS, MOCK_STATS, MOCK_TRANSACTIONS
} from '../utils/mockData';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';

// Services & Components
import { paymentService } from '../services/paymentService';
import GlassCard from '../components/GlassCard';
import SectionHeader from '../components/SectionHeader';
import QRScannerModal from '../components/QRScannerModal';
import Avatar from '../components/Avatar';
import QRCodeModule from '../components/QRCodeModule';

const { width } = Dimensions.get('window');

export default function PaymentsScreen() {
    const { theme, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const route = useRoute();
    const navigation = useNavigation();

    // -- Global State --
    const { netBalance, transactions, addManualTransaction, refreshTransactions } = useFinance();
    const [upiId, setUpiId] = useState('');
    const [myUpiId, setMyUpiId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [verifiedName, setVerifiedName] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const isProcessingReturn = useRef(false);

    // -- State: UI --
    const [selectedMethod, setSelectedMethod] = useState(MOCK_ACCOUNTS[0]);
    const [isScannerVisible, setIsScannerVisible] = useState(false);
    const [isMyQRVisible, setIsMyQRVisible] = useState(false);
    const [qrAmount, setQrAmount] = useState('');
    const [qrNote, setQrNote] = useState('Payment');
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllTransactions, setShowAllTransactions] = useState(false);

    // -- Animations --
    const scanPulse = useSharedValue(1);
    const glowOpacity = useSharedValue(0.4);

    useEffect(() => {
        scanPulse.value = withRepeat(
            withSequence(withTiming(1.15, { duration: 1000 }), withTiming(1, { duration: 1000 })),
            -1, true
        );
        glowOpacity.value = withRepeat(
            withSequence(withTiming(0.8, { duration: 1500 }), withTiming(0.4, { duration: 1500 })),
            -1, true
        );
        refreshTransactions();
    }, [refreshTransactions]);

    useEffect(() => {
        if (route.params?.openScanner) {
            setIsScannerVisible(true);
        }
    }, [route.params]);

    const animatedScanStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scanPulse.value }],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: scanPulse.value * 1.2 }],
    }));

    // -- API Calls --
    const fetchData = async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const balanceRes = await paymentService.getBalance();
            setMyUpiId(balanceRes.upiId);
            await refreshTransactions();
        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    // -- AppState Return Handler (Production Fix) --
    useEffect(() => {
        const handleAppStateChange = async (nextAppState) => {
            if (nextAppState === 'active') {
                console.log("[AppState] App foregrounded. Checking for pending UPI payments...");
                setTimeout(() => {
                    handleReturnFromUPI();
                }, 1000); // UI Stability delay
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        // Initial check on mount (in case app reloaded)
        handleReturnFromUPI();

        return () => subscription.remove();
    }, []);

    const handleReturnFromUPI = async () => {
        if (isProcessingReturn.current) return;

        try {
            const data = await AsyncStorage.getItem("pendingPayment");
            if (!data) return;

            const payment = JSON.parse(data);
            if (payment.status !== "pending") return;

            console.log("[UPI Return] Processing recovered payment:", payment);
            isProcessingReturn.current = true;
            setPaymentLoading(true);

            const options = {
                amount: parseFloat(payment.amount),
                upiId: payment.upiId,
                note: payment.note,
                method: payment.method || 'UPI',
                recipientName: payment.recipientName || 'Receiver'
            };

            const config = payment.trustConfirmed ? { headers: { 'x-trust-confirmed': 'true' } } : {};
            const res = await paymentService.createOrder(options, config);

            if (res.success) {
                console.log("[UPI Return] ✅ Payment Success processed via recovery.");
                await AsyncStorage.removeItem("pendingPayment");
                
                // Optimistic Local Logic
                addManualTransaction({
                    amount: options.amount,
                    type: 'debit',
                    note: options.note || 'Transfer',
                    source: 'upi',
                    upiId: options.upiId,
                    recipientName: options.recipientName,
                    category: res.transaction?.category || 'other'
                });

                setUpiId('');
                setAmount('');
                setNote('');
                
                // Navigate Replace (Production requirement)
                navigation.replace('PaymentReceipt', { transaction: res.transaction });
            }
        } catch (error) {
            console.error("[UPI Return] ❌ Recovery Error:", error.message);
            // Optionally keep in storage to retry or clear if permanent failure
        } finally {
            isProcessingReturn.current = false;
            setPaymentLoading(false);
        }
    };

    const handleUpiChange = (text) => {
        setUpiId(text);
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        if (upiRegex.test(text)) {
            setVerifiedName('Verified UPI ID');
        } else {
            setVerifiedName('');
        }
    };

    const initiatePayment = async (isTrustConfirmed = false) => {
        if (!upiId || !amount) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert('Please enter recipient and amount');
            return;
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert('Please enter a valid amount greater than 0');
            return;
        }

        try {
            if (numAmount > netBalance) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                alert('Insufficient Balance');
                return;
            }

            setPaymentLoading(true);
            if (!isTrustConfirmed) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Safe Link Generation
            const generateUPILink = (uId, name, amt, userNote) => {
                if (!uId || !amt) return null;
                const safeName = encodeURIComponent(name || 'Receiver');
                const safeNote = encodeURIComponent(userNote || 'Payment');
                const safeAmount = Number(amt).toFixed(2);
                const safeTr = 'TR' + Date.now();
                return `upi://pay?pa=${uId}&pn=${safeName}&am=${safeAmount}&cu=INR&tn=${safeNote}&tr=${safeTr}`;
            };

            const upiUrl = generateUPILink(upiId, verifiedName, amount, note);
            if (upiUrl) {
                console.log('🔗 Generated UPI Link:', upiUrl);
                
                // ── PERSIST BEFORE REDIRECT (Production Fix) ──
                const pendingData = {
                    upiId,
                    amount,
                    note,
                    recipientName: verifiedName || 'Receiver',
                    method: selectedMethod.type,
                    status: 'pending',
                    timestamp: Date.now(),
                    trustConfirmed: isTrustConfirmed
                };
                await AsyncStorage.setItem("pendingPayment", JSON.stringify(pendingData));
                console.log("[UPI Flow] Intent persisted to AsyncStorage.");

                try {
                    const supported = await Linking.canOpenURL(upiUrl);
                    if (supported) {
                        await Linking.openURL(upiUrl);
                    } else {
                        Alert.alert('Payment app not found', 'Please install a compatible UPI app (Google Pay, PhonePe) to proceed.');
                    }
                } catch (e) {
                    console.error('Deep link validation error:', e);
                }
            }
        } catch (error) {
            const data = error.response?.data;
            if (data?.code === 'TRUST_WARNING') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert(
                    "Security Warning",
                    data.message + "\n\nDo you want to proceed anyway?",
                    [
                        { text: "Cancel", style: "cancel", onPress: () => setPaymentLoading(false) },
                        { 
                            text: "Yes, Proceed", 
                            onPress: () => initiatePayment(true) 
                        }
                    ]
                );
                return; // Don't turn off loading yet, it will be handled by the next call
            }

            const errorMsg = data?.message || 'Something went wrong. Please try again.';
            alert(errorMsg);
        } finally {
            if (!isTrustConfirmed) setPaymentLoading(false);
        }
    };

    const handleScan = (data) => {
        setIsScannerVisible(false);
        if (data.startsWith('upi://')) {
            try {
                const params = new URLSearchParams(data.split('?')[1]);
                const pa = params.get('pa');
                
                if (!pa) {
                     Alert.alert('Invalid QR Code', 'The scanned QR code is missing a valid UPI ID (pa).');
                     return;
                }

                setUpiId(pa);
                setVerifiedName(params.get('pn') || '');
                if (params.get('am')) setAmount(params.get('am'));
                if (params.get('tn')) setNote(params.get('tn'));
                
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
                Alert.alert('Invalid QR Code', 'Failed to parse the UPI QR payload structure.');
            }
        } else {
            Alert.alert('Invalid QR Code', 'This is not a valid UPI payment QR code.');
        }
    };

    // -- Sub-Components --
    const SectionToggle = ({ title, isActive, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.filterChip, isActive && { backgroundColor: theme.colors.primary }]}
        >
            <Text style={[styles.filterText, { color: isActive ? '#FFF' : theme.colors.textSecondary }]}>{title}</Text>
        </TouchableOpacity>
    );

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.upiId?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' ||
            (activeFilter === 'Sent' && tx.type === 'sent') ||
            (activeFilter === 'Received' && tx.type === 'received') ||
            (activeFilter === 'Failed' && tx.status === 'failed');
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* -- Header -- */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: theme.colors.textHint }]}>Welcome back,</Text>
                    <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Payments</Text>
                </View>
                <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name="notifications-outline" size={24} color={theme.colors.textPrimary} />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* -- Synchronized Balance Card -- */}
                <Animated.View entering={FadeInDown.delay(50)} style={styles.balanceSection}>
                    <LinearGradient colors={['#4F46E5', '#3B82F6']} style={styles.balanceCard}>
                        <View>
                            <Text style={styles.balLabel}>AVAILABLE BALANCE</Text>
                            <Text style={styles.balValue}>₹{netBalance.toLocaleString()}</Text>
                        </View>
                        <View style={styles.syncBadge}>
                            <Ionicons name="sync-circle" size={16} color="#FFF" />
                            <Text style={styles.syncText}>Live</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* -- Top Alert / Reward Banner -- */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.bannerContainer}>
                    <LinearGradient colors={['#EC4899', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rewardsBanner}>
                        <View style={styles.rewardContent}>
                            <MaterialCommunityIcons name="ticket-percent" size={28} color="#FFF" />
                            <View style={styles.rewardTextWrapper}>
                                <Text style={styles.rewardTitle}>You have ₹{MOCK_REWARDS.cashback} cashback!</Text>
                                <Text style={styles.rewardSubtitle}>{MOCK_REWARDS.pendingScratchCards} scratch cards pending</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.claimBtn}>
                            <Text style={styles.claimBtnText}>Claim</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>

                {/* -- Accounts & Cards Section -- */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title="Your Accounts & Cards" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {MOCK_ACCOUNTS.map((acc) => (
                            <TouchableOpacity
                                key={acc.id}
                                activeOpacity={0.9}
                                onPress={() => {
                                    setSelectedMethod(acc);
                                    Haptics.selectionAsync();
                                }}
                            >
                                <LinearGradient
                                    colors={acc.color}
                                    style={[styles.accCard, selectedMethod.id === acc.id && styles.selectedAcc]}
                                >
                                    <View style={styles.accCardTop}>
                                        <MaterialCommunityIcons
                                            name={acc.type === 'CARD' ? 'credit-card-outline' : 'bank-outline'}
                                            size={20} color="#FFF"
                                        />
                                        {selectedMethod.id === acc.id && <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                                    </View>
                                    <Text style={styles.accBank}>{acc.bank}</Text>
                                    <Text style={styles.accNumber}>{acc.accountNo}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.addAccBtn}>
                            <Ionicons name="add" size={24} color={theme.colors.textHint} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* -- Quick Pay Section -- */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title="Quick Pay" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {MOCK_CONTACTS.map((contact) => (
                            <TouchableOpacity
                                key={contact.id}
                                style={styles.contactItem}
                                onPress={() => {
                                    setUpiId(contact.upiId);
                                    setVerifiedName(contact.name);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Image source={{ uri: contact.img }} style={styles.contactImg} />
                                <Text style={[styles.contactName, { color: theme.colors.textPrimary }]} numberOfLines={1}>{contact.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Spending Insights Section Removed */}

                {/* -- Payment Form Section -- */}
                <Animated.View entering={FadeInUp.delay(400)} style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.formHeader}>
                        <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>Pay / Send Money</Text>
                        <View style={styles.methodBadge}>
                            <Text style={styles.methodText}>Via {selectedMethod.type}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceAlt }]}>
                            <Ionicons name="at-outline" size={20} color={theme.colors.textHint} />
                            <TextInput
                                placeholder="UPI ID / Mobile"
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                value={upiId}
                                onChangeText={handleUpiChange}
                            />
                            <TouchableOpacity onPress={() => setIsScannerVisible(true)}>
                                <Ionicons name="scan-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{marginLeft: 14}} onPress={() => setIsMyQRVisible(true)}>
                                <Ionicons name="qr-code-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        {verifiedName ? (
                            <View style={styles.verifiedInfo}>
                                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                                <Text style={[styles.verifiedText, { color: theme.colors.textSecondary }]}>{verifiedName}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, styles.amountInput, { backgroundColor: theme.colors.surfaceAlt }]}>
                            <Text style={[styles.currencyPrefix, { color: theme.colors.textPrimary }]}>₹</Text>
                            <TextInput
                                placeholder="0.00"
                                style={[styles.input, { fontWeight: '700' }]}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                        <View style={[styles.inputWrapper, styles.noteInput, { backgroundColor: theme.colors.surfaceAlt }]}>
                            <TextInput
                                placeholder="Note"
                                style={styles.input}
                                value={note}
                                onChangeText={setNote}
                            />
                        </View>
                    </View>

                    <TouchableOpacity activeOpacity={0.8} onPress={initiatePayment} disabled={paymentLoading}>
                        <LinearGradient colors={GRADIENTS.primary} style={styles.payButton}>
                            {paymentLoading ? <ActivityIndicator color="#FFF" /> : (
                                <Text style={styles.payButtonText}>Pay Securely</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* -- Bills & Recharge Section -- */}
                <View style={styles.sectionContainer}>
                    <SectionHeader title="Bills & Recharge" />
                    <View style={styles.billsGrid}>
                        {MOCK_BILLS.map((bill) => (
                            <TouchableOpacity key={bill.id} style={styles.billItem}>
                                <View style={[styles.billIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
                                    <Ionicons name={bill.icon} size={24} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.billName, { color: theme.colors.textSecondary }]}>{bill.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* -- Transaction List 2.0 -- */}
                <View style={styles.historySection}>
                    <SectionHeader title="Transaction History" />

                    <View style={styles.filterRow}>
                        {['All', 'Sent', 'Received', 'Failed'].map(f => (
                            <SectionToggle
                                key={f} title={f}
                                isActive={activeFilter === f}
                                onPress={() => setActiveFilter(f)}
                            />
                        ))}
                    </View>

                    <View style={styles.txList}>
                        {filteredTransactions.slice(0, showAllTransactions ? undefined : 5).map((tx, i) => (
                            <View key={tx._id || tx.id} style={[styles.txCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.txIconBase, { backgroundColor: tx.type === 'sent' ? '#fee2e2' : '#dcfce7' }]}>
                                    <Ionicons
                                        name={tx.type === 'sent' ? "arrow-up" : "arrow-down"}
                                        size={20}
                                        color={tx.type === 'sent' ? '#ef4444' : '#22c55e'}
                                    />
                                </View>
                                <View style={styles.txDetails}>
                                    <View style={styles.txHeading}>
                                        <Text style={[styles.txName, { color: theme.colors.textPrimary }]}>{tx.name || tx.receiver?.name}</Text>
                                        <View style={styles.txMethodTag}><Text style={styles.txMethodText}>{tx.method || 'UPI'}</Text></View>
                                    </View>
                                    <Text style={[styles.txTime, { color: theme.colors.textHint }]}>{tx.date || new Date(tx.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.txRight}>
                                    <Text style={[styles.txAmount, { color: tx.type === 'sent' ? theme.colors.error : theme.colors.success }]}>
                                        {tx.type === 'sent' ? '-' : '+'} ₹{tx.amount}
                                    </Text>
                                    <TouchableOpacity style={styles.payAgainLink} onPress={() => {
                                        setUpiId(tx.upiId);
                                        setAmount(tx.amount.toString().replace('-', ''));
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}>
                                        <Text style={styles.payAgainText}>Pay Again</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {filteredTransactions.length > 5 && (
                        <TouchableOpacity 
                            style={[styles.viewMoreBtn, { borderTopColor: theme.colors.border }]} 
                            onPress={() => setShowAllTransactions(!showAllTransactions)}
                        >
                            <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>
                                {showAllTransactions ? 'Show Less' : `View All (${filteredTransactions.length})`}
                            </Text>
                            <Ionicons 
                                name={showAllTransactions ? "chevron-up" : "chevron-down"} 
                                size={16} 
                                color={theme.colors.primary} 
                            />
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>

            {/* -- Floating Glowy Scan Button -- */}
            <View style={styles.fabContainer}>
                <Animated.View style={[styles.fabGlow, animatedGlowStyle]} />
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsScannerVisible(true)}
                >
                    <Animated.View style={[styles.fab, animatedScanStyle]}>
                        <LinearGradient colors={GRADIENTS.hero} style={styles.fabGradient}>
                            <Ionicons name="scan-outline" size={30} color="#FFF" />
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <QRScannerModal
                visible={isScannerVisible}
                onClose={() => setIsScannerVisible(false)}
                onScan={handleScan}
            />

            {/* My QR Modal */}
            <Modal visible={isMyQRVisible} animationType="slide" transparent={true} onRequestClose={() => setIsMyQRVisible(false)}>
                <View style={styles.qrModalContainer}>
                    <View style={[styles.qrModalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.qrModalHeader}>
                            <Text style={[styles.qrModalTitle, { color: theme.colors.textPrimary }]}>Receive via QR</Text>
                            <TouchableOpacity onPress={() => setIsMyQRVisible(false)}>
                                <Ionicons name="close" size={28} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrWrapper}>
                            {myUpiId ? (
                                <QRCodeModule
                                    value={`upi://pay?pa=${myUpiId}&pn=${encodeURIComponent('Me')}&am=${qrAmount}&cu=INR&tn=${encodeURIComponent(qrNote)}`}
                                    size={200}
                                    color={theme.colors.textPrimary}
                                    backgroundColor="transparent"
                                />
                            ) : (
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            )}
                        </View>

                        <Text style={[styles.qrUpiText, { color: theme.colors.textSecondary }]}>
                            {myUpiId || 'Fetching UPI ID...'}
                        </Text>

                        <View style={styles.qrInputRow}>
                            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceAlt, flex: 1 }]}>
                                <Text style={[styles.currencyPrefix, { color: theme.colors.textPrimary }]}>₹</Text>
                                <TextInput
                                    placeholder="Amount (Optional)"
                                    placeholderTextColor={theme.colors.textHint}
                                    style={[styles.input, { color: theme.colors.textPrimary }]}
                                    keyboardType="numeric"
                                    value={qrAmount}
                                    onChangeText={setQrAmount}
                                />
                            </View>
                        </View>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceAlt, marginTop: 10 }]}>
                            <TextInput
                                placeholder="Note (Optional)"
                                placeholderTextColor={theme.colors.textHint}
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                value={qrNote}
                                onChangeText={setQrNote}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    greeting: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    title: { fontSize: 28, fontFamily: TYPOGRAPHY.fonts.headingBold },
    iconButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    notificationBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#FFF' },
    scrollContent: { paddingBottom: Platform.OS === 'ios' ? 150 : 130 },
    bannerContainer: { paddingHorizontal: 20, marginTop: 10 },
    rewardsBanner: { borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.medium },
    rewardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rewardTextWrapper: { gap: 2 },
    rewardTitle: { color: '#FFF', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    rewardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
    claimBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    claimBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    sectionContainer: { marginTop: 25 },
    horizontalScroll: { paddingLeft: 20, paddingRight: 20, gap: 15 },
    accCard: { width: 150, height: 100, borderRadius: 20, padding: 15, justifyContent: 'space-between', ...SHADOWS.soft },
    selectedAcc: { borderWidth: 2, borderColor: '#FFF' },
    accCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
    accBank: { color: '#FFF', fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    accNumber: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
    addAccBtn: { width: 60, height: 100, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
    contactItem: { alignItems: 'center', gap: 8, width: 70 },
    contactImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#6366F1' },
    contactName: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    insightsCard: { marginHorizontal: 20, padding: 20, ...SHADOWS.soft },
    insightsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    insightsTitle: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    insightsContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    insightsLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    insightsValue: { fontSize: 24, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 4 },
    chartWrapper: { flex: 1, marginLeft: 30, gap: 8 },
    chartBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    chartBarFill: { height: '100%', borderRadius: 4 },
    chartLabel: { fontSize: 10, textAlign: 'right' },
    formContainer: { marginHorizontal: 20, marginTop: 30, borderRadius: 24, padding: 24, ...SHADOWS.medium },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    formTitle: { fontSize: 16, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    methodBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    methodText: { color: '#6366F1', fontSize: 10, fontWeight: '700' },
    inputGroup: { marginBottom: 16 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 52, borderRadius: 14, gap: 12 },
    input: { flex: 1, fontFamily: TYPOGRAPHY.fonts.bodyMedium, fontSize: 14, color: '#1E293B' },
    verifiedInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 4, gap: 6 },
    verifiedText: { fontSize: 12, color: '#10B981' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    amountInput: { flex: 1 },
    noteInput: { flex: 1 },
    currencyPrefix: { fontSize: 18, fontWeight: '700' },
    payButton: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...SHADOWS.button },
    payButtonText: { color: '#FFF', fontSize: 16, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    billsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 15, marginTop: 15 },
    billItem: { width: (width - 70) / 4, alignItems: 'center', gap: 8 },
    billIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft },
    billName: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    historySection: { marginTop: 35, paddingHorizontal: 20 },
    filterRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
    filterText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    txList: { gap: 12 },
    txCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, ...SHADOWS.soft },
    txIconBase: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    txDetails: { flex: 1, marginLeft: 12, gap: 2 },
    txHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    txName: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    txMethodTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    txMethodText: { fontSize: 8, color: '#64748B', fontWeight: '800' },
    txTime: { fontSize: 10 },
    txRight: { alignItems: 'flex-end', gap: 4 },
    txAmount: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold },
    payAgainLink: { paddingVertical: 2 },
    payAgainText: { color: '#6366F1', fontSize: 11, fontWeight: '700' },
    fabContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 104 : 84, width: '100%', alignItems: 'center' },
    fabGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(99, 102, 241, 0.4)' },
    fab: { width: 70, height: 70, borderRadius: 35, ...SHADOWS.strong },
    fabGradient: { flex: 1, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    
    // -- Global Balance Sync UI --
    balanceSection: { paddingHorizontal: 20, marginTop: 10 },
    balanceCard: { 
        padding: 24, borderRadius: 24, flexDirection: 'row', 
        justifyContent: 'space-between', alignItems: 'center',
        ...SHADOWS.medium 
    },
    balLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1 },
    balValue: { color: '#FFF', fontSize: 32, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 4 },
    syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    syncText: { color: '#FFF', fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    viewMoreBtn: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        gap: 6, marginTop: 16, paddingVertical: 12, borderTopWidth: 1 
    },
    viewMoreText: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    qrModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
    qrModalContent: { width: '100%', borderRadius: 30, padding: 24 },
    qrModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    qrModalTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold },
    qrWrapper: { alignSelf: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 5, marginBottom: 20 },
    qrUpiText: { textAlign: 'center', fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodySemiBold, marginBottom: 20 },
    qrInputRow: { flexDirection: 'row', marginTop: 10 }
});
