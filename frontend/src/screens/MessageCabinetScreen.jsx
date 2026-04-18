import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// Context & Theme
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';
import { useTheme } from '../context/ThemeContext';
import { TYPOGRAPHY, SHADOWS } from '../constants/theme';
import BackButton from '../components/BackButton';
import { ActivityIndicator } from 'react-native';

const TABS = [
    { id: 'ecommerce', label: 'E-commerce', icon: 'cart-outline', color: '#6366F1' },
    { id: 'otp', label: 'OTP', icon: 'lock-closed-outline', color: '#10B981' },
    { id: 'spam', label: 'Spam', icon: 'shield-outline', color: '#F43F5E' },
];

export default function MessageCabinetScreen() {
    const { theme, isDarkMode } = useTheme();
    const { 
        spamMessages, 
        ecommerceMessages, 
        otpMessages, 
        removeMessage, 
        clearCategory,
        isDataLoaded
    } = useSMSAnalytics();

    const [activeTab, setActiveTab] = useState('ecommerce');

    const currentMessages = useMemo(() => {
        if (activeTab === 'ecommerce') return ecommerceMessages || [];
        if (activeTab === 'otp') return otpMessages || [];
        return spamMessages || [];
    }, [activeTab, ecommerceMessages, otpMessages, spamMessages]);

    if (!isDataLoaded) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#020617', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#6366F1" />
            </SafeAreaView>
        );
    }

    const handleClearAll = () => {
        Alert.alert(
            "Clear Category",
            `Are you sure you want to delete all ${activeTab} messages?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Clear All", style: "destructive", onPress: () => clearCategory(activeTab) }
            ]
        );
    };

    const handleCopyOTP = (text) => {
        const otpMatch = text.match(/\d{4,8}/);
        if (otpMatch) {
            const code = otpMatch[0];
            Alert.alert("OTP Code", `Code: ${code}\n\n(Feature: Copy to clipboard simulated)`);
        } else {
            Alert.alert("Notice", "Could not find code automatically.");
        }
    };

    const renderItem = ({ item, index }) => {
        const isOTP = activeTab === 'otp';
        const isSpam = activeTab === 'spam';

        return (
            <Animated.View 
                entering={FadeInDown.delay(index * 50).duration(400)}
                layout={Layout.springify()}
                style={[styles.card, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.senderBox}>
                        <View style={[styles.iconDot, { backgroundColor: TABS.find(t => t.id === activeTab).color }]} />
                        <Text style={[styles.senderText, { color: theme.colors.textPrimary }]}>{item.sender || 'Unknown'}</Text>
                    </View>
                    <Text style={[styles.timeText, { color: theme.colors.textHint }]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <Text style={[styles.messageText, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                    {item.text}
                </Text>

                <View style={styles.cardFooter}>
                    <View style={styles.badgeRow}>
                        {isOTP && (
                             <View style={[styles.badge, { backgroundColor: '#10B98115' }]}>
                                <Text style={[styles.badgeText, { color: '#10B981' }]}>15M CLEANUP</Text>
                             </View>
                        )}
                        {isSpam && (
                             <View style={[styles.badge, { backgroundColor: '#F43F5E15' }]}>
                                <Text style={[styles.badgeText, { color: '#F43F5E' }]}>1H CLEANUP</Text>
                             </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        {isOTP && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopyOTP(item.text)}>
                                <Ionicons name="copy-outline" size={18} color="#10B981" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionBtn} onPress={() => removeMessage(item.id, activeTab)}>
                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <BackButton />
                    <View style={{ marginLeft: 16 }}>
                        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Message Cabinet</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textHint }]}>Smart filtering active</Text>
                    </View>
                </View>
                {(currentMessages && currentMessages.length > 0) && (
                    <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                        <Ionicons name="trash-bin-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Segmented Control */}
            <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F3F4F6' }]}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity 
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            style={[
                                styles.tab,
                                isActive && { backgroundColor: theme.colors.surface, ...SHADOWS.small }
                            ]}
                        >
                            <Ionicons 
                                name={tab.icon} 
                                size={18} 
                                color={isActive ? tab.color : theme.colors.textHint} 
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: isActive ? theme.colors.textPrimary : theme.colors.textHint }
                            ]}>
                                {tab.label.split(' ')[0]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={currentMessages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="mail-open-outline" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>All Clear!</Text>
                        <Text style={[styles.emptySub, { color: theme.colors.textHint }]}>
                            No {activeTab} messages found.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 24, fontFamily: TYPOGRAPHY.fonts.headingBold },
    subtitle: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.body },
    clearBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, padding: 4, borderRadius: 16, marginBottom: 16 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
    tabLabel: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold },

    list: { paddingHorizontal: 20, paddingBottom: 100 },
    card: { padding: 16, borderRadius: 20, marginBottom: 12, ...SHADOWS.small },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    senderBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconDot: { width: 8, height: 8, borderRadius: 4 },
    senderText: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold },
    timeText: { fontSize: 12, fontFamily: TYPOGRAPHY.fonts.body },
    messageText: { fontSize: 14, fontFamily: TYPOGRAPHY.fonts.body, lineHeight: 20 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    badgeRow: { flexDirection: 'row', gap: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontFamily: TYPOGRAPHY.fonts.headingBold },
    actions: { flexDirection: 'row', gap: 16 },
    actionBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

    emptyContainer: { alignItems: 'center', paddingVertical: 100 },
    emptyTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fonts.headingBold, marginTop: 16 },
    emptySub: { fontSize: 14, marginTop: 4, textAlign: 'center' }
});
