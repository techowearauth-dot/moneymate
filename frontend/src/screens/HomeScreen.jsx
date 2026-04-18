import React, { useState, useRef, useContext, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    TouchableOpacity, TextInput, Modal, Pressable,
    KeyboardAvoidingView, Platform, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInDown, FadeInUp, 
    ZoomIn, Layout, 
    useSharedValue, useAnimatedStyle, withTiming, withSpring,
    runOnJS
} from 'react-native-reanimated';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';
import { useFinance } from '../context/FinanceContext';
import Avatar from '../components/Avatar';
import SalaryModal from '../components/SalaryModal';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [50, 100, 500, 1000];
const PILL_CATS = ['food', 'travel', 'shopping', 'bills'];
const DAILY_BUDGET = 2000;

const ALL_CATS = [
    { id: 'food', label: 'Food', emoji: '🍔' },
    { id: 'travel', label: 'Travel', emoji: '🚗' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'bills', label: 'Bills', emoji: '📄' },
    { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { id: 'health', label: 'Health', emoji: '🏥' },
    { id: 'education', label: 'Education', emoji: '📚' },
    { id: 'groceries', label: 'Groceries', emoji: '🛒' },
    { id: 'recharge', label: 'Recharge', emoji: '📱' },
    { id: 'rent', label: 'Rent', emoji: '🏠' },
    { id: 'fuel', label: 'Fuel', emoji: '⛽' },
    { id: 'subscription', label: 'Subscription', emoji: '💳' },
    { id: 'gifts', label: 'Gifts', emoji: '🎁' },
    { id: 'other', label: 'Others', emoji: '📦' },
];
const CAT = ALL_CATS.reduce((m, c) => { m[c.id] = c; return m; }, {});

// Removed hardcoded DUMMY_SMS to use global SMSAnalyticsContext

// AI_INSIGHTS are now derived from SMSAnalyticsContext globally



const P = {
    bg: '#F8FAFC',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    primary: ['#6366F1', '#3B82F6'], // Indigo -> Blue
    accent: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    rose: '#F43F5E',
    indigo: '#6366F1',
    blue: '#3B82F6',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textHint: '#94A3B8',
};

/** Helpers for futuristic visual effects */
const GLASS = { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' };
const HERO_GLOW = { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 16 };
const CARD_SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 };
const FAB_GLOW = { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.65, shadowRadius: 20, elevation: 18 };

/** Simple greeting based on time of day */
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

// ─────────────────────────────────────────────────────────────
//  MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Animated count-up number */
function AnimatedNumber({ value }) {
  const sv = useSharedValue(0);
  useEffect(() => {
    sv.value = withTiming(value, { duration: 1000 });
  }, [value]);

  const animatedProps = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1, { duration: 300 }),
    };
  });

  return (
    <Animated.Text style={animatedProps}>
        ₹{value.toLocaleString()}
    </Animated.Text>
  );
}

/** 3-col stat card with 3D feel */
function StatCard({ icon, iconBg, iconColor, label, value, theme, delay = 0 }) {
    return (
        <Animated.View 
            entering={FadeInDown.delay(delay).springify()}
            style={[S.statCard, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}
        >
            <View style={[S.statIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={15} color={iconColor} />
            </View>
            <Text style={[S.statValue, { color: theme.colors.textPrimary }]}>₹{value.toLocaleString()}</Text>
            <Text style={[S.statLabel, { color: theme.colors.textHint }]}>{label}</Text>
        </Animated.View>
    );
}

/** Modern Budget tracker with gradient bar */
function BudgetTracker({ spent, theme }) {
    const pct = Math.min(spent / DAILY_BUDGET, 1);
    const barWidth = useSharedValue(0);
    const barColor = pct > 0.85 ? COLORS.error : pct > 0.6 ? COLORS.warning : COLORS.success;

    useEffect(() => {
        barWidth.value = withSpring(pct * 100, { damping: 15 });
    }, [pct]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${barWidth.value}%`,
        backgroundColor: barColor,
    }));

    return (
        <Animated.View 
            entering={FadeInDown.delay(200)}
            style={[S.budgetCard, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}
        >
            <View style={S.budgetHeader}>
                <View>
                    <Text style={[S.budgetTitle, { color: theme.colors.textPrimary }]}>Daily Budget</Text>
                    <Text style={[S.budgetSub, { color: theme.colors.textHint }]}>₹{DAILY_BUDGET.toLocaleString()} / day</Text>
                </View>
                <View style={[S.budgetBadge, { backgroundColor: barColor + '18' }]}>
                    <Text style={[S.budgetPct, { color: barColor }]}>{Math.round(pct * 100)}%</Text>
                </View>
            </View>
            <View style={[S.barBg, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Animated.View style={[S.barFill, animatedStyle]} />
            </View>
            <View style={S.budgetRow}>
                <Text style={[S.budgetRowText, { color: COLORS.error }]}>Spent ₹{spent.toLocaleString()}</Text>
                <Text style={[S.budgetRowText, { color: COLORS.success }]}>
                    Left ₹{Math.max(DAILY_BUDGET - spent, 0).toLocaleString()}
                </Text>
            </View>
        </Animated.View>
    );
}

/** Futuristic Glass SMS card */
function SmsCard({ theme }) {
    const { smsAnalytics, aiInsights } = useSMSAnalytics();
    const [cardExpanded, setCardExpanded] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const msgCount = smsAnalytics?.total || 0;
    const MESSAGES = smsAnalytics?.messages || [];
    const visibleMessages = isExpanded ? MESSAGES : MESSAGES.slice(0, 3);
    const financialCount = (smsAnalytics?.debitCount || 0) + (smsAnalytics?.creditCount || 0);
    const latestPreview = MESSAGES[0]?.original_sms || MESSAGES[0]?.text || 'No transactions detected yet';

    return (
        <Animated.View 
            entering={FadeInDown.delay(300)}
            style={[S.smsCard, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}
        >
            <View style={S.smsHeader}>
                <View style={S.smsTitleRow}>
                    <View style={[S.smsIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                        <Ionicons name="chatbubble-ellipses" size={17} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={[S.smsTitle, { color: theme.colors.textPrimary }]}>Smart SMS Insights</Text>
                        <Text style={[S.smsAuto, { color: theme.colors.textHint }]}>Auto-detected from SMS</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => setCardExpanded(e => !e)}
                    style={[S.expandBtn, { backgroundColor: theme.colors.surfaceAlt }]}
                >
                    <Ionicons name={cardExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={theme.colors.textHint} />
                </TouchableOpacity>
            </View>

            {cardExpanded && (
                <Animated.View entering={FadeInDown} style={S.insightsList}>
                    {aiInsights && aiInsights.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                            {aiInsights.map((insight) => (
                                <View key={insight.id} style={[S.insightPill, { backgroundColor: insight.bg }]}>
                                    <Ionicons name={insight.icon} size={14} color={insight.color} />
                                    <View>
                                        <Text style={[S.insightText, { color: insight.color }]}>{insight.text}</Text>
                                        <Text style={[S.insightSub, { color: insight.color, opacity: 0.8 }]}>{insight.sub}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </Animated.View>
            )}

            <View style={S.smsStats}>
                {[
                    { n: msgCount, l: 'Total', c: COLORS.primary, bg: COLORS.primaryLight },
                    { n: financialCount, l: 'Finance', c: COLORS.success, bg: '#dcfce7' },
                    { n: smsAnalytics?.debitCount || 0, l: 'Debits', c: COLORS.error, bg: '#fee2e2' },
                ].map((s, i) => (
                    <View key={i} style={[S.smsStat, { backgroundColor: s.bg }]}>
                        <Text style={[S.smsStatN, { color: s.c }]}>{s.n}</Text>
                        <Text style={[S.smsStatL, { color: s.c }]}>{s.l}</Text>
                    </View>
                ))}
            </View>
            
            <View style={[S.smsPreview, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Ionicons name="flash" size={12} color={COLORS.warning} />
                <Text style={[S.smsPreviewTxt, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {latestPreview}
                </Text>
            </View>

            {cardExpanded && (
                <View style={S.smsListContainer}>
                    {visibleMessages.map((sms, index) => (
                        <View key={sms.id || index} style={[S.smsRow, { borderBottomColor: theme.colors.border }]}>
                            <View style={[S.smsDot, { backgroundColor: sms.type === 'credit' ? COLORS.success : sms.type === 'debit' ? COLORS.error : COLORS.warning }]} />
                            <Text style={[S.smsRowTxt, { color: theme.colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                                {sms.original_sms || sms.text}
                            </Text>
                            {!!sms.amount && (
                                <Text style={[S.smsAmt, { color: sms.type === 'credit' ? COLORS.success : COLORS.error }]}>
                                    {sms.type === 'credit' ? '+' : '-'}₹{sms.amount.toLocaleString()}
                                </Text>
                            )}
                        </View>
                    ))}
                    {MESSAGES.length > 3 && (
                        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={S.viewMoreBtn}>
                            <Text style={S.viewMoreTxt}>{isExpanded ? "Show Less" : "View More"}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </Animated.View>
    );
}

/** Category grid modal */
function CatModal({ visible, selected, onSelect, onClose, theme }) {
    const translateY = useSharedValue(height);

    useEffect(() => {
        translateY.value = withSpring(visible ? 0 : height, { 
            damping: 15,
            stiffness: 90
        });
    }, [visible]);

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Pressable style={S.overlay} onPress={onClose} />
            <Animated.View style={[S.catSheet, { backgroundColor: theme.colors.surface }, sheetStyle]}>
                <View style={[S.handle, { backgroundColor: theme.colors.border }]} />
                <Text style={[S.catSheetTitle, { color: theme.colors.textPrimary }]}>Choose Category</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={S.catGrid}>
                        {ALL_CATS.map(cat => {
                            const a = selected === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id} activeOpacity={0.8}
                                    onPress={() => { onSelect(cat.id); onClose(); }}
                                    style={[S.catGridItem, { backgroundColor: a ? theme.colors.primary : theme.colors.surfaceAlt }]}
                                >
                                    <Text style={S.catGE}>{cat.emoji}</Text>
                                    <Text style={[S.catGL, { color: a ? '#FFF' : theme.colors.textSecondary }]}>{cat.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}

/** Confirm modal with separate reset options */
function ConfirmReset({ visible, onManual, onAll, onFull, onCancel, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={S.overlay}>
                <View style={[S.confirmBox, { backgroundColor: theme.colors.surface }, SHADOWS.strong]}>
                    <Text style={{ fontSize: 38 }}>🗑️</Text>
                    <Text style={[S.confirmTitle, { color: theme.colors.textPrimary }]}>Reset Ledger?</Text>
                    <Text style={[S.confirmSub, { color: theme.colors.textHint }]}>
                        Choose how you want to clear your data. "Factory Reset" clears everything including your salary.
                    </Text>
                    <View style={S.confirmBtns}>
                        <TouchableOpacity style={[S.confirmBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={onCancel} activeOpacity={0.8}>
                            <Text style={[S.confirmBtnTxt, { color: theme.colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[S.confirmBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={onManual} activeOpacity={0.8}>
                            <Text style={[S.confirmBtnTxt, { color: theme.colors.textPrimary }]}>Manual Only</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[S.confirmBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={onAll} activeOpacity={0.8}>
                            <Text style={[S.confirmBtnTxt, { color: theme.colors.textPrimary }]}>All Analytics</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[S.confirmBtn, { backgroundColor: COLORS.error }]} onPress={onFull} activeOpacity={0.8}>
                            <Text style={[S.confirmBtnTxt, { color: '#FFF' }]}>Factory Reset</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/** Entry form inside modal */
function EntryForm({ onAdd, theme, onClose }) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('food');
    const [note, setNote] = useState('');
    const [catOpen, setCatOpen] = useState(false);
    const isPill = PILL_CATS.includes(category);
    const selCat = CAT[category];

    const handleAdd = () => {
        const v = parseFloat(amount);
        if (!v || isNaN(v) || v <= 0) return;
        onAdd({ id: Date.now(), amount: v, type, category, note });
        setAmount(''); setNote('');
        onClose?.();
    };

    return (
        <View style={S.form}>
            {/* Amount */}
            <View style={[S.amountBox, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text style={[S.rupee, { color: theme.colors.primary }]}>₹</Text>
                <TextInput
                    autoFocus
                    style={[S.amountInput, { color: theme.colors.textPrimary }]}
                    placeholder="0.00" placeholderTextColor={theme.colors.textHint}
                    keyboardType="numeric" value={amount} onChangeText={setAmount} returnKeyType="done"
                />
            </View>
            {/* Quick */}
            <View style={S.quickRow}>
                {QUICK_AMOUNTS.map(v => (
                    <TouchableOpacity key={v} activeOpacity={0.75} onPress={() => setAmount(String(v))}
                        style={[S.qChip, { backgroundColor: amount === String(v) ? theme.colors.primary : theme.colors.surfaceAlt }]}>
                        <Text style={[S.qChipTxt, { color: amount === String(v) ? '#FFF' : theme.colors.textSecondary }]}>₹{v}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Toggle */}
            <View style={[S.typeToggle, { backgroundColor: theme.colors.surfaceAlt }]}>
                {['expense', 'income'].map(t => (
                    <TouchableOpacity key={t} activeOpacity={0.85} onPress={() => setType(t)}
                        style={[S.typeBtn, type === t && { backgroundColor: t === 'expense' ? COLORS.error : COLORS.success }]}>
                        <Ionicons name={t === 'expense' ? 'arrow-up-outline' : 'arrow-down-outline'} size={14} color={type === t ? '#FFF' : theme.colors.textHint} />
                        <Text style={[S.typeTxt, { color: type === t ? '#FFF' : theme.colors.textHint }]}>{t === 'expense' ? 'Expense' : 'Income'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Category pills */}
            <View style={S.catRow}>
                {PILL_CATS.map(id => {
                    const c = CAT[id]; const a = category === id;
                    return (
                        <TouchableOpacity key={id} activeOpacity={0.8} onPress={() => setCategory(id)}
                            style={[S.cPill, { backgroundColor: a ? theme.colors.primary : theme.colors.surfaceAlt }]}>
                            <Text style={S.cPillE}>{c.emoji}</Text>
                            <Text style={[S.cPillT, { color: a ? '#FFF' : theme.colors.textSecondary }]}>{c.label}</Text>
                        </TouchableOpacity>
                    );
                })}
                <TouchableOpacity activeOpacity={0.8} onPress={() => setCatOpen(true)}
                    style={[S.cPill, { backgroundColor: !isPill ? theme.colors.primary : theme.colors.surfaceAlt }]}>
                    {!isPill && <Text style={S.cPillE}>{selCat?.emoji}</Text>}
                    <Text style={[S.cPillT, { color: !isPill ? '#FFF' : theme.colors.textSecondary }]}>
                        {!isPill ? selCat?.label : 'More +'}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Note */}
            <View style={[S.noteBox, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Ionicons name="create-outline" size={16} color={theme.colors.textHint} />
                <TextInput style={[S.noteInput, { color: theme.colors.textPrimary }]}
                    placeholder="Add a note (optional)" placeholderTextColor={theme.colors.textHint}
                    value={note} onChangeText={setNote} />
            </View>
            {/* CTA */}
            <TouchableOpacity activeOpacity={0.9} onPress={handleAdd}>
                <LinearGradient colors={type === 'expense' ? ['#EF4444', '#DC2626'] : ['#22C55E', '#16A34A']} style={S.addBtn}>
                    <Ionicons name="checkmark-circle-outline" size={19} color="#FFF" />
                    <Text style={S.addBtnTxt}>Add Entry</Text>
                </LinearGradient>
            </TouchableOpacity>
            <CatModal visible={catOpen} selected={category} onSelect={setCategory} onClose={() => setCatOpen(false)} theme={theme} />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
    const { theme, isDarkMode } = useTheme();

    const [entries, setEntries] = useState([]);
    const [hidden, setHidden] = useState(false);
    const [modal, setModal] = useState(false);
    const [resetModal, setResetModal] = useState(false);
    const [showSalaryOverride, setShowSalaryOverride] = useState(false);
    const { smsAnalytics, user, updateSalary, resetAnalytics, aiInsights } = useSMSAnalytics();
    const { netBalance, totalReceived, totalSpent, addManualTransaction, refreshTransactions } = useFinance();
    
    const modalY = useSharedValue(height);
    const fabRotate = useSharedValue(0);

    // Fetch fresh transactions on mount
    useEffect(() => {
        refreshTransactions();
    }, [refreshTransactions]);

    const net = netBalance;
    const todayExp = totalSpent;
    const todayInc = totalReceived;
    const streak = 3;
    const firstName = user?.name?.split(' ')[0] || 'there';
    const isSalarySet = !!user?.salary && user.salary > 0;

    const addEntry = (entry) => {
        setEntries(p => [entry, ...p]);
        addManualTransaction({
            amount: entry.amount,
            type: entry.type === 'income' ? 'income' : 'expense',
            category: entry.category,
            note: entry.note
        });
        closeModal();
    };

    const openModal = () => {
        setModal(true);
        modalY.value = withSpring(0, { damping: 15 });
        fabRotate.value = withTiming(45);
    };

    const closeModal = () => {
        modalY.value = withTiming(height, { duration: 300 }, () => {
            runOnJS(setModal)(false);
        });
        fabRotate.value = withTiming(0);
    };

    const combinedEntries = (() => {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const todaysSms = (smsAnalytics?.messages || []).filter(m => {
            const mDate = typeof m.date === 'string' ? new Date(m.date).getTime() : m.date;
            return mDate >= startOfToday;
        }).map(m => ({
            id: m.id || m.timestamp || Math.random(),
            amount: m.amount || 0,
            type: m.type === 'credit' ? 'income' : 'expense',
            category: m.category || 'other',
            note: m.merchant || 'SMS Alert',
            date: typeof m.date === 'string' ? new Date(m.date).getTime() : (m.date || Date.now()),
            isAuto: true
        }));
        return [...entries, ...todaysSms].sort((a, b) => b.date - a.date);
    })();

    const modalAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: modalY.value }],
    }));

    const fabAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${fabRotate.value}deg` }],
    }));

    return (
        <SafeAreaView style={[S.root, { backgroundColor: P.bg }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* ── HEADER ── */}
            <Animated.View entering={FadeInUp.delay(100)} style={S.header}>
                <View>
                    <Text style={S.greeting}>{getGreeting()},</Text>
                    <Text style={S.userName}>{firstName} 👋</Text>
                </View>
                <View style={S.headerRight}>
                    <TouchableOpacity 
                        onPress={() => setResetModal(true)}
                        style={S.iconBtn}
                    >
                        <Ionicons name="refresh-outline" size={19} color={P.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={S.iconBtn}>
                        <Ionicons name="notifications-outline" size={19} color={P.textSecondary} />
                        {combinedEntries.length > 0 && <View style={S.notifDot} />}
                    </TouchableOpacity>
                    <Avatar name={user?.name} size={42} imageUri={user?.avatar} onPress={() => navigation?.openDrawer?.()} />
                </View>
            </Animated.View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={S.scroll} 
                keyboardShouldPersistTaps="handled"
            >
                {/* ── BALANCE HERO (GLASS CARD) ── */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <LinearGradient 
                        colors={P.primary} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                        style={S.hero}
                    >
                        <View style={S.heroTop}>
                            <View>
                                <Text style={S.heroLbl}>NET BALANCE</Text>
                                {isSalarySet && (
                                    <View style={S.salaryBadge}>
                                        <View style={S.salaryDot} />
                                        <Text style={S.salaryLabel}>Calculated via AI</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity 
                                onPress={() => isSalarySet && setHidden(h => !h)} 
                                style={{ opacity: isSalarySet ? 1 : 0.5 }}
                            >
                                <Ionicons name={hidden ? 'eye-off' : 'eye'} size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={S.heroAmtWrapper}>
                            <Text style={[S.heroAmt, !isSalarySet && { opacity: 0.15 }]}>
                                {hidden ? '₹ ••••••' : <AnimatedNumber value={net} />}
                            </Text>
                            
                            {!isSalarySet && (
                                <View style={S.heroLockedOverlay}>
                                    <TouchableOpacity 
                                        style={S.lockBtn} 
                                        onPress={() => setShowSalaryOverride(true)}
                                    >
                                        <Ionicons name="lock-closed" size={12} color="#FFF" />
                                        <Text style={S.lockBtnTxt}>Set Salary to Unlock</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <Text style={S.heroSub}>
                            {smsAnalytics?.total === 0 ? 'Watching for banking SMS...' : `${smsAnalytics?.total} transactions analyzed`}
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={isSalarySet ? openModal : () => setShowSalaryOverride(true)} 
                            style={S.heroBtn} 
                            activeOpacity={0.8}
                        >
                            <Ionicons name={isSalarySet ? "add-circle" : "wallet"} size={16} color="#FFF" />
                            <Text style={S.heroBtnTxt}>{isSalarySet ? "Quick Add" : "Unlock Ledger"}</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>

                {/* ── STREAK PILL ── */}
                <Animated.View entering={FadeInDown.delay(300)} style={S.streakRow}>
                    <LinearGradient colors={['#F59E0B', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.streakChip}>
                        <Text style={S.streakF}>🔥</Text>
                        <Text style={S.streakTxt}>{streak} Day Tracking Streak</Text>
                    </LinearGradient>
                </Animated.View>

                {/* ── STAT TILES ── */}
                <View style={[S.statsRow, !isSalarySet && { opacity: 0.6 }]}>
                    <StatCard icon="arrow-up" iconColor={P.error} iconBg="#fee2e2" label="Spent" value={todayExp} theme={theme} delay={400} />
                    <StatCard icon="arrow-down" iconColor={P.success} iconBg="#dcfce7" label="Received" value={todayInc} theme={theme} delay={500} />
                    <StatCard icon="wallet-outline" iconColor={P.accent} iconBg="#f5f3ff" label="Balance" value={isSalarySet ? Math.abs(net) : 0} theme={theme} delay={600} />
                </View>

                {/* ── SECTIONS ── */}
                <View style={S.section}>
                    <Text style={S.sectionTitle}>Budget Tracker</Text>
                    <BudgetTracker spent={todayExp} theme={theme} />
                </View>

                <View style={S.section}>
                    <SmsCard theme={theme} />
                </View>

                {/* ── ENTRIES ── */}
                <View style={S.section}>
                    <View style={S.sectionHeaderRow}>
                        <Text style={S.sectionTitle}>Recent Activities</Text>
                        {combinedEntries.length > 0 && (
                            <TouchableOpacity onPress={() => setResetModal(true)} style={S.resetLink}>
                                <Text style={S.resetLinkTxt}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    {combinedEntries.length === 0 ? (
                        <Animated.View entering={ZoomIn.delay(500)} style={S.emptyCard}>
                            <Image 
                                source={{ uri: 'file:///C:/Users/Vinayak Kumar/.gemini/antigravity/brain/3668a6a4-effd-4da9-a2be-d0a80b3ef892/fintech_rocket_home_illustration_1776509333788.png' }} 
                                style={{ width: 140, height: 140 }} 
                                resizeMode="contain"
                            />
                            <Text style={S.emptyTitle}>Start tracking your money 🚀</Text>
                            <Text style={S.emptySub}>Add an entry manually or wait for AI to detect SMS transactions.</Text>
                        </Animated.View>
                    ) : (
                        combinedEntries.slice(0, 5).map((e, idx) => {
                            const cat = CAT[e.category];
                            return (
                                <Animated.View 
                                    key={e.id} 
                                    entering={FadeInDown.delay(100 * idx)}
                                    layout={Layout.springify()}
                                    style={S.entryRow}
                                >
                                    <View style={[S.entryIconWrap, { backgroundColor: e.type === 'expense' ? '#fee2e2' : '#dcfce7' }]}>
                                        <Text style={{ fontSize: 20 }}>{cat?.emoji || '📦'}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={S.entryCat}>{cat?.label || 'Others'}</Text>
                                            {e.isAuto && (
                                                <View style={S.autoPill}>
                                                    <Text style={S.autoPillTxt}>AUTO</Text>
                                                </View>
                                            )}
                                        </View>
                                        {e.note ? <Text style={S.entryNote} numberOfLines={1}>{e.note}</Text> : null}
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <Text style={[S.entryAmt, { color: e.type === 'expense' ? P.error : P.success }]}>
                                            {e.type === 'expense' ? '-' : '+'}₹{e.amount.toLocaleString()}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: P.textHint }}>
                                            {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </Animated.View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* ── FAB ── */}
            <TouchableOpacity activeOpacity={0.8} onPress={openModal} style={S.fab}>
                <LinearGradient colors={P.primary} style={S.fabGrad}>
                    <Animated.View style={fabAnimatedStyle}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </Animated.View>
                </LinearGradient>
            </TouchableOpacity>

            {/* ── ENTRY MODAL ── */}
            {modal && (
                <Modal visible={modal} transparent animationType="none" onRequestClose={closeModal}>
                    <Pressable style={S.overlay} onPress={closeModal} />
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.kav} pointerEvents="box-none">
                        <Animated.View style={[S.sheet, modalAnimatedStyle]}>
                            <View style={S.handle} />
                            <View style={S.sheetHeader}>
                                <Text style={S.sheetTitle}>New Ledger Entry</Text>
                                <TouchableOpacity onPress={closeModal}>
                                    <Ionicons name="close-circle" size={30} color={P.textHint} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <EntryForm onAdd={addEntry} theme={theme} onClose={closeModal} />
                            </ScrollView>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </Modal>
            )}

            {/* ── RESET CONFIRM ── */}
            <ConfirmReset
                visible={resetModal}
                onManual={() => { setEntries([]); setResetModal(false); }}
                onAll={() => { setEntries([]); resetAnalytics(); setResetModal(false); }}
                onFull={async () => {
                    setEntries([]);
                    resetAnalytics();
                    await updateSalary(0);
                    setResetModal(false);
                }}
                onCancel={() => setResetModal(false)}
                theme={theme}
            />

            {/* ── SALARY COLLECTION ── */}
            <SalaryModal
                visible={(user && user.salary === null) || showSalaryOverride}
                onSave={async (val) => {
                    await updateSalary(val);
                    setShowSalaryOverride(false);
                }}
            />
        </SafeAreaView>
    );
}



// ─────────────────────────────────────────────────────────────
//  STYLES  (pure StyleSheet — zero logic changes)
// ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingBottom: 100, paddingTop: 10 },
    
    // ── Header ──
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
    },
    greeting: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyMedium, color: P.textSecondary },
    userName: { fontSize: 24, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.textPrimary, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
        ...SHADOWS.soft, borderWidth: 1, borderColor: P.glassBorder,
    },
    notifDot: {
        position: 'absolute', top: 12, right: 12, width: 8, height: 8,
        borderRadius: 4, backgroundColor: P.error, borderWidth: 2, borderColor: '#FFF',
    },

    // ── Hero Card ──
    hero: {
        marginHorizontal: 20, borderRadius: 32, padding: 28,
        marginBottom: 20, ...SHADOWS.strong,
        shadowColor: '#6366F1',
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLbl: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1.5 },
    heroAmt: { fontSize: 42, fontFamily: TYPOGRAPHY.fonts.headingBold, color: '#FFF', marginTop: 12, marginBottom: 8 },
    heroAmtWrapper: { minHeight: 60, justifyContent: 'center' },
    heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    heroBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20,
        paddingVertical: 12, borderRadius: 99, marginTop: 20,
        flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    heroBtnTxt: { color: '#FFF', fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    salaryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 8, marginTop: 4,
    },
    salaryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
    salaryLabel: { color: '#FFF', fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    heroLockedOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    lockBtn: {
        backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 16,
        paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    lockBtnTxt: { color: '#FFF', fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // ── Streak ──
    streakRow: { paddingHorizontal: 20, marginBottom: 20 },
    streakChip: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start',
    },
    streakF: { fontSize: 18 },
    streakTxt: { color: '#FFF', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // ── Stats ──
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
    statCard: {
        flex: 1, padding: 18, borderRadius: 24, alignItems: 'center', gap: 8,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: P.glassBorder,
        ...SHADOWS.soft,
    },
    statIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.textPrimary },
    statLabel: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold, color: P.textHint, textTransform: 'uppercase' },

    // ── Sections ──
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.textPrimary, marginBottom: 16 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    resetLink: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FEE2E2' },
    resetLinkTxt: { fontSize: 12, color: P.error, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // ── Budget Tracker ──
    budgetCard: { padding: 22, borderRadius: 28, gap: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: P.glassBorder, ...SHADOWS.soft },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    budgetTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold },
    budgetSub: { fontSize: 12, color: P.textSecondary, marginTop: 2 },
    budgetBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    budgetPct: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.headingBold },
    barBg: { height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#F1F5F9' },
    barFill: { height: '100%', borderRadius: 5 },
    budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
    budgetRowText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // ── SMS Card ──
    smsCard: { padding: 22, borderRadius: 28, gap: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: P.glassBorder, ...SHADOWS.soft },
    smsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    smsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    smsIconWrap: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    smsTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold },
    smsAuto: { fontSize: 11, color: P.textSecondary },
    expandBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    insightsList: { marginTop: 4 },
    insightPill: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, marginRight: 10 },
    insightText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    insightSub: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    smsStats: { flexDirection: 'row', gap: 10 },
    smsStat: { flex: 1, padding: 14, borderRadius: 18, alignItems: 'center', gap: 4 },
    smsStatN: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold },
    smsStatL: { fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold, textTransform: 'uppercase' },
    smsPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, marginTop: 4, backgroundColor: '#F8FAFC' },
    smsPreviewTxt: { flex: 1, fontSize: 11, color: P.textSecondary },
    smsListContainer: { marginTop: 10, gap: 8 },
    smsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    smsDot: { width: 8, height: 8, borderRadius: 4 },
    smsRowTxt: { fontSize: 12, color: P.textPrimary },
    smsAmt: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.headingBold },
    viewMoreBtn: { paddingVertical: 10, alignItems: 'center' },
    viewMoreTxt: { fontSize: 13, color: P.accent, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    // ── Entries ──
    entryRow: { 
        flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, 
        borderRadius: 24, backgroundColor: '#FFF', marginBottom: 12,
        borderWidth: 1, borderColor: P.glassBorder, ...SHADOWS.soft,
    },
    entryIconWrap: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    entryCat: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.bodyBold, color: P.textPrimary },
    entryNote: { fontSize: 12, color: P.textSecondary, marginTop: 2 },
    entryAmt: { fontSize: 16, fontFamily: TYPOGRAPHY.fonts.headingBold },
    autoPill: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    autoPillTxt: { fontSize: 8, fontFamily: TYPOGRAPHY.fonts.bodyBold, color: '#3B82F6' },
    emptyCard: { 
        paddingVertical: 60, paddingHorizontal: 32, borderRadius: 32, alignItems: 'center', gap: 20, 
        backgroundColor: '#FFF', borderWidth: 1, borderColor: P.glassBorder, ...SHADOWS.soft,
    },
    emptyTitle: { fontSize: 19, fontFamily: TYPOGRAPHY.fonts.headingBold, textAlign: 'center', color: P.textPrimary },
    emptySub: { fontSize: 14, color: P.textSecondary, textAlign: 'center', lineHeight: 22 },

    // ── FAB ──
    fab: {
        position: 'absolute', bottom: 30, right: 24, width: 68, height: 68, 
        borderRadius: 34, ...SHADOWS.strong, shadowColor: '#6366F1',
    },
    fabGrad: { flex: 1, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },

    // ── Modal / Sheet ──
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    kav: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36,
        padding: 24, paddingTop: 16, ...SHADOWS.strong, shadowOpacity: 0.1,
    },
    handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sheetTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.textPrimary },

    // ── Form Elements ──
    form: { gap: 18 },
    amountBox: { 
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, 
        height: 84, borderRadius: 24, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    },
    rupee: { fontSize: 32, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.accent },
    amountInput: { flex: 1, fontSize: 40, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.textPrimary },
    quickRow: { flexDirection: 'row', gap: 8 },
    qChip: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', backgroundColor: '#F1F5F9' },
    qChipTxt: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold, color: P.textSecondary },
    typeToggle: { flexDirection: 'row', gap: 8, padding: 6, borderRadius: 22, backgroundColor: '#F1F5F9' },
    typeBtn: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    typeTxt: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: '#F1F5F9' },
    cPillE: { fontSize: 16 },
    cPillT: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold, color: P.textSecondary },
    noteBox: { 
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, 
        height: 60, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    },
    noteInput: { flex: 1, fontSize: 15, fontFamily: TYPOGRAPHY.fonts.bodyMedium, color: P.textPrimary },
    addBtn: { height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, ...SHADOWS.soft },
    addBtnTxt: { color: '#FFF', fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold },

    // ── Category Sheet ──
    catSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, height: height * 0.75 },
    catSheetTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold, marginBottom: 20, color: P.textPrimary },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    catGridItem: { width: (width - 72) / 4, paddingVertical: 20, borderRadius: 24, alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC' },
    catGE: { fontSize: 24 },
    catGL: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold, textAlign: 'center', color: P.textSecondary },

    // ── Confirm Modal ──
    confirmBox: { backgroundColor: '#FFF', padding: 32, borderRadius: 32, margin: 24, alignItems: 'center', gap: 16, ...SHADOWS.strong },
    confirmTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold, color: P.textPrimary },
    confirmSub: { fontSize: 14, color: P.textSecondary, textAlign: 'center', lineHeight: 22 },
    confirmBtns: { width: '100%', gap: 10, marginTop: 12 },
    confirmBtn: { width: '100%', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    confirmBtnTxt: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.bodyBold },
});

