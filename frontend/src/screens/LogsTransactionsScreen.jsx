import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, 
    TouchableOpacity, TextInput, ActivityIndicator,
    Alert, Dimensions, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Design System
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, GRADIENTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { paymentService } from '../services/paymentService';
import BackButton from '../components/BackButton';
import { useFinance } from '../context/FinanceContext';

const { width } = Dimensions.get('window');

const categoryColors = {
    food: '#F59E0B',
    travel: '#3B82F6',
    shopping: '#EC4899',
    bills: '#8B5CF6',
    rent: '#10B981',
    other: '#6B7280'
};

export default function LogsTransactionsScreen({ navigation }) {
    const { theme, isDarkMode } = useTheme();
    const { netBalance } = useFinance();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); // All, Credit, Debit
    
    // Multi-Select State
    const [selectedTxIds, setSelectedTxIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await paymentService.getTransactions();
            if (res.success) {
                setTransactions(res.transactions);
            }
        } catch (error) {
            console.error('Fetch tx error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        console.log("Deleting ID:", id);
                        
                        // Optimistic UI Update
                        let updated;
                        setTransactions(prev => {
                            updated = prev.filter(t => t._id !== id && t.id !== id);
                            console.log("Remaining:", updated);
                            return updated;
                        });
                        setSelectedTxIds(prev => prev.filter(selectedId => selectedId !== id));
                        
                        // Backend sync
                        try {
                            await paymentService.deleteTransaction(id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete transaction. Reverting...');
                            fetchTransactions(); // Revert on failure
                        }
                    }
                }
            ]
        );
    };

    const handleBulkDelete = () => {
        if (selectedTxIds.length === 0) return;
        Alert.alert(
            "Delete Selected",
            "Delete selected transactions?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setIsDeletingBulk(true);
                        console.log("Deleting IDs:", selectedTxIds);
                        
                        // Optimistic UI update
                        let updated;
                        setTransactions(prev => {
                            updated = prev.filter(t => !selectedTxIds.includes(t._id || t.id));
                            console.log("Remaining:", updated);
                            return updated;
                        });
                        const idsToDelete = [...selectedTxIds];
                        setSelectedTxIds([]);

                        try {
                            await paymentService.deleteBulkTransactions(idsToDelete);
                            setIsSelectionMode(false); // Reset selection mode on success
                        } catch (error) {
                            Alert.alert('Error', 'Failed to bulk delete. Reverting...');
                            fetchTransactions();
                        } finally {
                            setIsDeletingBulk(false);
                        }
                    }
                }
            ]
        );
    };

    const toggleSelection = (id) => {
        Haptics.selectionAsync();
        setSelectedTxIds(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    // Apply Filter & Search
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                tx.note?.toLowerCase().includes(searchLower) || 
                tx.upiId?.toLowerCase().includes(searchLower) ||
                tx.name?.toLowerCase().includes(searchLower) ||
                tx.category?.toLowerCase().includes(searchLower);
                
            let isTypeMatch = true;
            if (activeFilter === 'Credit') {
                isTypeMatch = tx.type === 'RECEIVED' || tx.type === 'received';
            } else if (activeFilter === 'Debit') {
                isTypeMatch = tx.type === 'SENT' || tx.type === 'sent';
            }

            return matchesSearch && isTypeMatch;
        });
    }, [transactions, searchQuery, activeFilter]);

    // Calculate Summary inside memo
    const { totalCredit, totalDebit, insights } = useMemo(() => {
        let credit = 0;
        let debit = 0;
        const categorySpend = {};

        transactions.forEach(tx => {
            const amount = parseFloat(tx.amount || 0);
            if (tx.type === 'RECEIVED' || tx.type === 'received') {
                credit += amount;
            } else {
                debit += amount;
                const cat = (tx.category || 'other').toLowerCase();
                categorySpend[cat] = (categorySpend[cat] || 0) + amount;
            }
        });

        // Determine Highest Expenditure Category Insight
        let highestCategory = 'other';
        let maxSpend = 0;
        for (const [cat, spend] of Object.entries(categorySpend)) {
            if (spend > maxSpend && cat !== 'other') {
                maxSpend = spend;
                highestCategory = cat;
            }
        }

        let insightText = "Great job managing your expenses!";
        if (maxSpend > 0) {
            insightText = `You spent the most on ${highestCategory.charAt(0).toUpperCase() + highestCategory.slice(1)} recently (₹${maxSpend.toLocaleString()}).`;
        }

        return { totalCredit: credit, totalDebit: debit, insights: insightText };
    }, [transactions]);

    const isAllSelected = filteredTransactions.length > 0 && selectedTxIds.length === filteredTransactions.length;
    
    const toggleSelectAll = () => {
        Haptics.selectionAsync();
        if (isAllSelected) {
            setSelectedTxIds([]);
        } else {
            setSelectedTxIds(filteredTransactions.map(t => t._id || t.id));
        }
    };

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonRow, { backgroundColor: theme.colors.surfaceAlt }]} />
            ))}
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No transactions found</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textHint }]}>We couldn't find any logs matching your criteria.</Text>
        </View>
    );

    const formatTime = (isoString) => {
        if (!isoString) return 'Just Now';
        const d = new Date(isoString);
        return d.toLocaleDateString() + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Logs & Transactions</Text>
                <TouchableOpacity onPress={fetchTransactions} style={styles.headerBtn}>
                    <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Top Summary Block */}
            <View style={styles.summaryWrapper}>
                <LinearGradient colors={GRADIENTS.primary} style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <View>
                            <Text style={styles.summaryLabel}>NET BALANCE</Text>
                            <Text style={styles.summaryBalance}>₹{netBalance.toLocaleString()}</Text>
                        </View>
                        <View style={styles.flowCard}>
                            <View style={styles.flowRow}>
                                <Ionicons name="arrow-down-circle" size={16} color="#4ADE80" />
                                <Text style={styles.flowText}>In: ₹{totalCredit.toLocaleString()}</Text>
                            </View>
                            <View style={styles.flowRow}>
                                <Ionicons name="arrow-up-circle" size={16} color="#F87171" />
                                <Text style={styles.flowText}>Out: ₹{totalDebit.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.insightBox}>
                        <Ionicons name="sparkles" size={16} color="#FDE047" />
                        <Text style={styles.insightText}>{insights}</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Search & Filters */}
            <View style={styles.controlsSection}>
                <View style={[styles.searchBox, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name="search" size={20} color={theme.colors.textHint} />
                    <TextInput 
                        placeholder="Search by Note, UPI or Category..."
                        placeholderTextColor={theme.colors.textHint}
                        style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterRow}>
                    <View style={{ flexDirection: 'row', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                        {['All', 'Credit', 'Debit'].map((f) => (
                            <TouchableOpacity 
                                key={f} 
                                style={[
                                    styles.filterPill, 
                                    { backgroundColor: theme.colors.surfaceAlt },
                                    activeFilter === f && { backgroundColor: theme.colors.primary }
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveFilter(f);
                                }}
                            >
                                <Text style={[
                                    styles.filterText, 
                                    { color: theme.colors.textSecondary },
                                    activeFilter === f && { color: '#FFF' }
                                ]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.selectionToggleBtn, isSelectionMode && { backgroundColor: theme.colors.primary }]} 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setIsSelectionMode(!isSelectionMode);
                            if (isSelectionMode) setSelectedTxIds([]); // Clear on exit
                        }}
                    >
                        <Ionicons name={isSelectionMode ? "checkmark-done" : "list"} size={18} color={isSelectionMode ? '#FFF' : theme.colors.textSecondary} />
                        <Text style={[styles.selectionToggleText, { color: isSelectionMode ? '#FFF' : theme.colors.textSecondary }]}>
                            {isSelectionMode ? 'Done' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isSelectionMode && (
                    <View style={styles.bulkActionsRow}>
                        <TouchableOpacity onPress={toggleSelectAll} style={styles.bulkActionBtn}>
                            <Ionicons name={isAllSelected ? "checkbox" : "square-outline"} size={20} color={theme.colors.primary} />
                            <Text style={[styles.bulkActionText, { color: theme.colors.primary }]}>{isAllSelected ? 'Deselect All' : 'Select All'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleBulkDelete} 
                            disabled={selectedTxIds.length === 0 || isDeletingBulk}
                            style={[
                                styles.bulkDeleteBtn, 
                                (selectedTxIds.length === 0 || isDeletingBulk) && { opacity: 0.5 }
                            ]}
                        >
                            {isDeletingBulk ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="trash" size={16} color="#FFF" />
                                    <Text style={styles.bulkDeleteBtnText}>Delete ({selectedTxIds.length})</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* List */}
            <View style={styles.listContainer}>
                {loading ? renderSkeleton() : (
                    <FlatList
                        data={filteredTransactions}
                        keyExtractor={item => item._id || item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.flatListContent}
                        ListEmptyComponent={renderEmpty}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        renderItem={({ item }) => {
                            const isIncoming = item.type === 'RECEIVED' || item.type === 'received';
                            const IconColor = isIncoming ? '#22C55E' : '#EF4444';
                            const BgColor = isIncoming ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                            const catColor = categoryColors[(item.category || 'other').toLowerCase()] || categoryColors.other;
                            
                            const txId = item._id || item.id;
                            const isSelected = selectedTxIds.includes(txId);

                            return (
                                <TouchableOpacity 
                                    activeOpacity={0.8}
                                    onPress={() => isSelectionMode ? toggleSelection(txId) : {}}
                                    onLongPress={() => {
                                        if (!isSelectionMode) {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                            setIsSelectionMode(true);
                                            toggleSelection(txId);
                                        }
                                    }}
                                    style={[
                                        styles.transactionCard, 
                                        { backgroundColor: theme.colors.surface },
                                        isSelected && { borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }
                                    ]}
                                >
                                    {isSelectionMode && (
                                        <View style={styles.checkboxContainer}>
                                            <Ionicons 
                                                name={isSelected ? "checkbox" : "square-outline"} 
                                                size={24} 
                                                color={isSelected ? theme.colors.primary : theme.colors.textHint} 
                                            />
                                        </View>
                                    )}

                                    <View style={[styles.txIconBase, { backgroundColor: BgColor }]}>
                                        <Ionicons 
                                            name={isIncoming ? "arrow-down" : "arrow-up"} 
                                            size={20} 
                                            color={IconColor} 
                                        />
                                    </View>
                                    
                                    <View style={styles.txDetails}>
                                        <View style={styles.txRow}>
                                            <Text style={[styles.txName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                                                {item.recipientName || item.upiId || 'Unknown'}
                                            </Text>
                                            <Text style={[styles.txAmount, { color: IconColor }]}>
                                                {isIncoming ? '+' : '-'} ₹{parseFloat(item.amount).toLocaleString()}
                                            </Text>
                                        </View>
                                        
                                        <Text style={[styles.txNote, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                            {item.note || 'No Note Context'}
                                        </Text>

                                        <View style={styles.txBottomContainer}>
                                            <View style={styles.badgeRow}>
                                                <View style={[styles.tagBadge, { backgroundColor: catColor + '20' }]}>
                                                    <Text style={[styles.tagText, { color: catColor }]}>{item.category || 'Other'}</Text>
                                                </View>
                                                <Text style={[styles.txTime, { color: theme.colors.textHint }]}>
                                                    {formatTime(item.createdAt || item.date)}
                                                </Text>
                                            </View>
                                            {!isSelectionMode && (
                                                <TouchableOpacity 
                                                    onPress={() => handleDelete(txId)}
                                                    style={styles.deleteBtn}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    headerTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingBold },
    summaryWrapper: { paddingHorizontal: 20, marginBottom: 15 },
    summaryCard: { borderRadius: 24, padding: 20, ...SHADOWS.medium },
    summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: TYPOGRAPHY.fonts.bodyBold, letterSpacing: 1 },
    summaryBalance: { color: '#FFF', fontSize: 32, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 4 },
    flowCard: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, gap: 6 },
    flowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    flowText: { color: '#FFF', fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    insightBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12, marginTop: 16, gap: 8 },
    insightText: { color: '#FFF', fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodyMedium, flex: 1 },
    controlsSection: { paddingHorizontal: 20, gap: 12, marginBottom: 15 },
    searchBox: { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 12, paddingHorizontal: 14, gap: 10 },
    searchInput: { flex: 1, fontFamily: TYPOGRAPHY.fonts.body, fontSize: 14 },
    filterRow: { flexDirection: 'row', gap: 10 },
    filterPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
    filterText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    listContainer: { flex: 1 },
    flatListContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
    transactionCard: { padding: 16, borderRadius: 20, flexDirection: 'row', ...SHADOWS.soft },
    txIconBase: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    txDetails: { flex: 1, marginLeft: 14, gap: 4 },
    txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    txName: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.bodyBold, flex: 1 },
    txAmount: { fontSize: 15, fontFamily: TYPOGRAPHY.fonts.headingBold },
    txNote: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.body },
    txBottomContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    tagText: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.bodyBold, textTransform: 'capitalize' },
    txTime: { fontSize: 11 },
    deleteBtn: { padding: 4 },
    skeletonContainer: { paddingHorizontal: 20, gap: 12 },
    skeletonRow: { height: 80, borderRadius: 20 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingSemi },
    emptyText: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.body, textAlign: 'center', maxWidth: 250 },
    
    // Header & Selection
    headerBtn: { padding: 8, marginRight: -8 },
    selectionToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    selectionToggleText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.bodySemiBold },
    checkboxContainer: { marginRight: 12, justifyContent: 'center' },
    bulkActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    bulkActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
    bulkActionText: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    bulkDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    bulkDeleteBtnText: { color: '#FFF', fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold }
});
