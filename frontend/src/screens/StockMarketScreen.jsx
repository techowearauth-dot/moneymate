import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Animated, StatusBar, Platform, Dimensions,
    ActivityIndicator, Alert, Pressable, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Design System
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';
import { useFinance } from '../context/FinanceContext';
import BackButton from '../components/BackButton';

const { width, height } = Dimensions.get('window');
const API_KEY = 'L7HK3GWB0MVOVGCK';
const CACHE_TIMEOUT = 5 * 60 * 1000; 

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const SmoothChart = ({ data, isUp, theme }) => {
    if (!data || data.length < 2) return null;

    const chartWidth = width - 72;
    const chartHeight = 140;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Convert data points to SVG coordinates
    const points = data.map((p, i) => ({
        x: (i / (data.length - 1)) * chartWidth,
        y: chartHeight - ((p - min) / range) * 110 - 15
    }));

    // Create a smooth SVG path using Quadratic Bézier curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = (p0.x + p1.x) / 2;
        pathData += ` Q ${p0.x} ${p0.y}, ${midX} ${(p0.y + p1.y) / 2} T ${p1.x} ${p1.y}`;
    }

    // Gradient fill path data
    const fillData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

    return (
        <Svg height={chartHeight} width={chartWidth}>
            <Defs>
                <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={isUp ? '#10B981' : '#F87171'} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={isUp ? '#10B981' : '#F87171'} stopOpacity="0" />
                </LinearGradient>
            </Defs>
            <Path d={fillData} fill="url(#fillGradient)" />
            <Path d={pathData} fill="none" stroke={isUp ? '#10B981' : '#F87171'} strokeWidth="3" strokeLinecap="round" />
        </Svg>
    );
};

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────

export default function StockMarketScreen() {
    const { theme, isDarkMode } = useTheme();
    const { smsAnalytics, user } = useSMSAnalytics();
    const { netBalance, stockInvestments, updateInvestments } = useFinance();

    // Portfolio and Balance now come from Global Finance Store
    const tradingBalance = netBalance;
    const portfolio = stockInvestments;

    const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.BSE');
    const [watchlist] = useState(['RELIANCE.BSE', 'TCS.BSE', 'INFY.BSE']);

    // UI & API State
    const [currentData, setCurrentData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [buyQty, setBuyQty] = useState('');
    const [portDrawerVisible, setPortDrawerVisible] = useState(false);
    const [learnDrawerVisible, setLearnDrawerVisible] = useState(false);

    // Initial load and Persistence handled by FinanceContext
    // No more local useEffect for load/save needed here for trading balance and portfolio

    const cacheRef = useRef({});

    const fetchData = async (symbol, force = false) => {
        const now = Date.now();
        if (!force && cacheRef.current[symbol] && (now - cacheRef.current[symbol].time < CACHE_TIMEOUT)) {
            setCurrentData(cacheRef.current[symbol].quote);
            setChartData(cacheRef.current[symbol].chart);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const quoteRes = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
            const quote = quoteRes.data['Global Quote'];
            
            if (!quote || Object.keys(quote).length === 0) {
                if (quoteRes.data['Note'] || quoteRes.data['Information']) throw new Error("API Limit Reached");
                throw new Error("Stock not found");
            }

            const chartRes = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`);
            const timeSeries = chartRes.data['Time Series (5min)'];
            
            let processedChart = [];
            if (timeSeries) {
                processedChart = Object.keys(timeSeries).slice(0, 50).map(key => parseFloat(timeSeries[key]['4. close'])).reverse();
            }

            const data = { quote, chart: processedChart, time: now };
            cacheRef.current[symbol] = data;
            
            setCurrentData(quote);
            setChartData(processedChart);
        } catch (err) {
            console.error(err);
            setError(err.message === "API Limit Reached" ? "Data temporarily unavailable" : "Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedSymbol);
    }, [selectedSymbol]);

    // Simulator Price Movement
    useEffect(() => {
        const timer = setInterval(() => {
            if (!currentData) return;
            // Fake price jitter for "real feel"
            const jitter = 1 + (Math.random() * 0.004 - 0.002); // ±0.2%
            setCurrentData(prev => {
                const newPrice = (parseFloat(prev['05. price']) * jitter);
                return { ...prev, '05. price': newPrice.toFixed(2) };
            });
        }, 4000);
        return () => clearInterval(timer);
    }, [currentData]);

    const handleBuy = () => {
        const qty = parseInt(buyQty);
        if (!qty || qty <= 0) return Alert.alert("Invalid Quantity");
        const price = parseFloat(currentData['05. price']);
        const cost = qty * price;

        if (cost > tradingBalance) return Alert.alert("Insufficient Balance");

        const updatedPortfolio = (() => {
            const existing = portfolio.find(p => p.symbol === selectedSymbol);
            if (existing) {
                const totalQty = existing.qty + qty;
                const newAvg = (existing.qty * existing.avgPrice + cost) / totalQty;
                return portfolio.map(p => p.symbol === selectedSymbol ? { ...p, qty: totalQty, avgPrice: newAvg, currentPrice: price } : p);
            }
            return [...portfolio, { symbol: selectedSymbol, qty, avgPrice: price, currentPrice: price }];
        })();

        updateInvestments(updatedPortfolio);
        setBuyQty('');
        Alert.alert("Execution Successful", `You bought ${qty} shares of ${selectedSymbol.split('.')[0]}`);
    };

    const handleSell = (symbolToExit = selectedSymbol, qtyToExit = null) => {
        const held = portfolio.find(p => p.symbol === symbolToExit);
        if (!held) return Alert.alert("Portfolio Error", "You don't own this stock");

        const qty = qtyToExit || parseInt(buyQty) || held.qty;
        if (qty <= 0 || qty > held.qty) return Alert.alert("Invalid Quantity");

        const price = parseFloat(currentData['05. price']);
        
        const updatedPortfolio = held.qty === qty 
            ? portfolio.filter(p => p.symbol !== symbolToExit)
            : portfolio.map(p => p.symbol === symbolToExit ? { ...p, qty: p.qty - qty } : p);

        updateInvestments(updatedPortfolio);
        setBuyQty('');
        Alert.alert("Execution Successful", `You exited ${qty} shares of ${symbolToExit.split('.')[0]}`);
    };

    // Global Stats
    const currentPrice = currentData ? parseFloat(currentData['05. price']) : 0;
    const isUp = currentData && (parseFloat(currentData['10. change percent']) >= 0);

    const portfolioAnalytics = useMemo(() => {
        let invested = 0;
        let current = 0;
        portfolio.forEach(p => {
            invested += p.qty * p.avgPrice;
            // Use live price for selected, or held avg for others
            const live = p.symbol === selectedSymbol ? currentPrice : p.avgPrice; 
            current += p.qty * live;
        });
        return { invested, current, pl: current - invested };
    }, [portfolio, selectedSymbol, currentPrice]);

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={styles.header}>
                <BackButton />
                <View style={styles.titleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Stock Market</Text>
                    <Text style={[styles.headerSub, { color: theme.colors.textHint }]}>Wealth Simulator</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => setPortDrawerVisible(true)} style={styles.hBtn}>
                        <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setLearnDrawerVisible(true)} style={styles.hBtn}>
                        <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fetchData(selectedSymbol, true)} style={styles.hBtn}>
                        <Ionicons name="refresh" size={18} color={theme.colors.textHint} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* Balance & PnL Card */}
                <ExpoGradient colors={['#4F46E5', '#3B82F6']} style={[styles.balanceCard, SHADOWS.strong]}>
                    <View style={styles.balRow}>
                        <View>
                            <Text style={styles.balLabel}>TRADING CAPITAL</Text>
                            <Text style={styles.balValue}>₹{tradingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                        </View>
                        <View style={styles.simBadge}><Text style={styles.simBadgeTxt}>SYNCED</Text></View>
                    </View>
                    
                    <View style={styles.statGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>INVESTED</Text>
                            <Text style={styles.statValue}>₹{portfolioAnalytics.invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>RETURNS</Text>
                            <Text style={[styles.statValue, { color: portfolioAnalytics.pl >= 0 ? '#10B981' : '#FCA5A5' }]}>
                                {portfolioAnalytics.pl >= 0 ? '+' : ''}₹{portfolioAnalytics.pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </Text>
                        </View>
                    </View>
                </ExpoGradient>

                {/* Symbol Pills */}
                <View style={[styles.pillStrip, { backgroundColor: theme.colors.surfaceAlt }]}>
                    {watchlist.map(sym => (
                        <TouchableOpacity 
                            key={sym} 
                            onPress={() => setSelectedSymbol(sym)}
                            style={[styles.pill, selectedSymbol === sym && { backgroundColor: COLORS.primary }]}
                        >
                            <Text style={[styles.pillTxt, { color: selectedSymbol === sym ? '#FFF' : theme.colors.textHint }]}>
                                {sym.split('.')[0]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading && !currentData ? (
                    <View style={styles.loader}><ActivityIndicator color={COLORS.primary} /></View>
                ) : error ? (
                    <View style={styles.error}><Text style={{ color: theme.colors.textHint }}>{error}</Text></View>
                ) : (
                    <>
                        {/* Selected Stock Live View */}
                        <View style={[styles.card, { backgroundColor: theme.colors.surface }, SHADOWS.soft]}>
                            <View style={styles.stockH}>
                                <View>
                                    <Text style={[styles.sName, { color: theme.colors.textPrimary }]}>{selectedSymbol.split('.')[0]}</Text>
                                    <View style={styles.mPill}><Text style={styles.mPillTxt}>NSE / BSE</Text></View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.sPrice, { color: theme.colors.textPrimary }]}>₹{currentPrice.toLocaleString()}</Text>
                                    <Text style={[styles.sChange, { color: isUp ? COLORS.success : COLORS.error }]}>
                                        {isUp ? '▲' : '▼'} {currentData?.['10. change percent'] || '0%'}
                                    </Text>
                                </View>
                            </View>

                            {/* Realistic Chart */}
                            <View style={styles.chartArea}>
                                <SmoothChart data={chartData} isUp={isUp} theme={theme} />
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                            {/* Simulation Trades */}
                            <View style={styles.tradeArea}>
                                <View style={styles.inputBox}>
                                    <TextInput 
                                        style={[styles.input, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}
                                        placeholder="Quantity"
                                        placeholderTextColor={theme.colors.textHint}
                                        value={buyQty}
                                        onChangeText={setBuyQty}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.estTotal, { color: theme.colors.textHint }]}>
                                        Est. Total: ₹{(parseInt(buyQty || 0) * currentPrice).toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.btnRow}>
                                    <TouchableOpacity onPress={handleBuy} style={[styles.btn, { backgroundColor: COLORS.success }]}>
                                        <Text style={styles.btnTxt}>BUY EQUITY</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleSell()} style={[styles.btn, { backgroundColor: COLORS.error }]}>
                                        <Text style={styles.btnTxt}>EXIT POSITION</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* PORTFOLIO DRAWER */}
            <Modal visible={portDrawerVisible} transparent animationType="slide" onRequestClose={() => setPortDrawerVisible(false)}>
                <BlurView intensity={30} tint="dark" style={S.drawerOverlay}>
                    <Pressable style={{ flex: 1 }} onPress={() => setPortDrawerVisible(false)} />
                    <View style={[S.drawer, { backgroundColor: theme.colors.surface }]}>
                        <View style={[S.handle, { backgroundColor: theme.colors.border }]} />
                        <Text style={[S.dTitle, { color: theme.colors.textPrimary }]}>My Holdings</Text>
                        
                        <ScrollView style={{ paddingHorizontal: 20 }}>
                            {portfolio.length === 0 ? (
                                <View style={S.empty}><Text style={{ color: theme.colors.textHint }}>No active investments</Text></View>
                            ) : (
                                portfolio.map((p, i) => {
                                    const live = p.symbol === selectedSymbol ? currentPrice : p.currentPrice;
                                    const pl = (live - p.avgPrice) * p.qty;
                                    return (
                                        <View key={i} style={[S.hRow, { borderBottomColor: theme.colors.border }]}>
                                            <View>
                                                <Text style={[S.hSym, { color: theme.colors.textPrimary }]}>{p.symbol.split('.')[0]}</Text>
                                                <Text style={[S.hQty, { color: theme.colors.textHint }]}>{p.qty} Shares @ ₹{p.avgPrice.toFixed(0)}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[S.hVal, { color: theme.colors.textPrimary }]}>₹{(p.qty * live).toFixed(0)}</Text>
                                                <Text style={[S.hPL, { color: pl >= 0 ? COLORS.success : COLORS.error }]}>
                                                    {pl >= 0 ? '+' : ''}₹{pl.toFixed(0)}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setPortDrawerVisible(false)} style={S.closeBtn}>
                            <Text style={S.closeBtnTxt}>Close Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>

            {/* EDUCATION DRAWER */}
            <Modal visible={learnDrawerVisible} transparent animationType="fade" onRequestClose={() => setLearnDrawerVisible(false)}>
                <BlurView intensity={40} tint="dark" style={S.drawerOverlay}>
                    <View style={[S.eduModal, { backgroundColor: theme.colors.surface }]}>
                        <View style={S.eduHeader}>
                            <Text style={[S.dTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>Market School</Text>
                            <TouchableOpacity onPress={() => setLearnDrawerVisible(false)}><Ionicons name="close-circle" size={24} color={theme.colors.textHint} /></TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <EduItem theme={theme} icon="bulb-outline" title="What is a Stock?" desc="Ownership in a company. When you buy a stock, you become a shareholder." />
                            <EduItem theme={theme} icon="business-outline" title="NSE & BSE" desc="India's major exchanges. NSE (Nifty) and BSE (Sensex) are where trading happens." />
                            <EduItem theme={theme} icon="trending-up-outline" title="Market Trends" desc="Bull Market (Prices going up) vs Bear Market (Prices going down)." />
                            <EduItem theme={theme} icon="shield-checkmark-outline" title="Investment Risk" desc="Market prices vary. Never invest money you can't afford to lose." />
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>

        </SafeAreaView>
    );
}

const EduItem = ({ theme, icon, title, desc }) => (
    <View style={S.eduItem}>
        <View style={[S.eduIcon, { backgroundColor: COLORS.primary + '15' }]}><Ionicons name={icon} size={20} color={COLORS.primary} /></View>
        <View style={{ flex: 1 }}>
            <Text style={[S.eduTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[S.eduDesc, { color: theme.colors.textHint }]}>{desc}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    titleContainer: { flex: 1, marginLeft: 16 },
    headerTitle: { fontSize: 22, fontFamily: TYPOGRAPHY.fonts.headingBold },
    headerSub: { fontSize: 11, fontFamily: TYPOGRAPHY.fonts.body, marginTop: 2 },
    headerRight: { flexDirection: 'row', gap: 8 },
    hBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.08)' },
    
    scroll: { padding: 20 },
    balanceCard: { padding: 24, borderRadius: 24, marginBottom: 20 },
    balRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    balLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    balValue: { fontSize: 32, color: '#FFF', fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 6 },
    simBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    simBadgeTxt: { color: '#FFF', fontSize: 9, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    statGrid: { flexDirection: 'row', marginTop: 20, gap: 24 },
    statItem: { flex: 1 },
    statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
    statValue: { fontSize: 16, color: '#FFF', fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 4 },

    pillStrip: { flexDirection: 'row', padding: 6, borderRadius: 14, marginBottom: 20, gap: 6 },
    pill: { flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    pillTxt: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    card: { padding: 20, borderRadius: 24, marginBottom: 20 },
    stockH: { flexDirection: 'row', justifyContent: 'space-between' },
    sName: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold },
    mPill: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
    mPillTxt: { fontSize: 8, color: COLORS.primary, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    sPrice: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold },
    sChange: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyBold, marginTop: 4 },
    
    chartArea: { height: 140, marginVertical: 20, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, marginVertical: 10 },
    tradeArea: { marginTop: 10 },
    inputBox: { marginBottom: 16 },
    input: { height: 48, fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold, borderBottomWidth: 1 },
    estTotal: { fontSize: 11, marginTop: 6 },
    btnRow: { flexDirection: 'row', gap: 12 },
    btn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    btnTxt: { color: 'white', fontFamily: TYPOGRAPHY.fonts.bodyBold, fontSize: 13 },
    
    loader: { height: 200, justifyContent: 'center' },
    error: { height: 100, justifyContent: 'center', alignItems: 'center' }
});

const S = StyleSheet.create({
    drawerOverlay: { flex: 1, justifyContent: 'flex-end' },
    drawer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, height: height * 0.7, paddingVertical: 20 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    dTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold, paddingHorizontal: 20, marginBottom: 20 },
    hRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, marginHorizontal: 20, borderBottomWidth: 1 },
    hSym: { fontSize: 16, fontFamily: TYPOGRAPHY.fonts.headingBold },
    hQty: { fontSize: 12, marginTop: 2 },
    hVal: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold },
    hPL: { fontSize: 12, marginTop: 2 },
    empty: { padding: 40, alignItems: 'center' },
    closeBtn: { margin: 20, height: 50, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    closeBtnTxt: { color: 'white', fontFamily: TYPOGRAPHY.fonts.bodyBold },

    eduModal: { width: width * 0.85, height: height * 0.6, borderRadius: 24, alignSelf: 'center', marginBottom: 'auto', marginTop: 'auto' },
    eduHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    eduItem: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    eduIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    eduTitle: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold },
    eduDesc: { fontSize: 12, marginTop: 4, lineHeight: 18 }
});
