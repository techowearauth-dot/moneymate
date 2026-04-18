import React, { useContext } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { MOCK_STATS } from '../utils/mockData';

// Components
import Avatar from '../components/Avatar';

export default function CustomDrawerContent(props) {
    const { user, logout } = useContext(AuthContext);
    const { theme, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const { state, navigation } = props;

    const menuItems = [
        { label: 'Home',             icon: 'home-outline',              screen: 'MainTabs',        bg: isDarkMode ? 'rgba(79, 70, 229, 0.1)'  : '#EEF2FF', color: '#6366F1' },
        { label: 'Logs & Transactions', icon: 'list-circle-outline',    screen: 'LogsTransactions', bg: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#DCFCE7', color: '#22C55E' },
        { label: t('securitySettings'), icon: 'shield-outline',           screen: 'SecuritySettings', bg: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', color: '#10B981' },
        { label: 'Payment Settings',  icon: 'card-outline',              screen: 'PaymentSettings',  bg: isDarkMode ? 'rgba(14, 165, 233, 0.1)'  : '#EFF6FF', color: '#0EA5E9' },
        { label: 'Fraud Detection',   icon: 'alert-circle-outline',      screen: 'FraudDetection',   bg: isDarkMode ? 'rgba(239, 68, 68, 0.1)'   : '#FEF2F2', color: '#EF4444' },
        { label: 'Stock Market',     icon: 'trending-up-outline',       screen: 'StockMarket',      bg: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#F5F3FF', color: '#8B5CF6' },
        { label: 'Parental Control',  icon: 'people-outline',            screen: 'ParentalControl',  bg: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', color: '#10B981' },
        { label: 'Message Cabinet',   icon: 'mail-unread-outline',       screen: 'MessageCabinet',   bg: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF', color: '#6366F1' },
        { label: 'Help & Support',    icon: 'help-circle-outline',       screen: 'HelpSupport',      bg: isDarkMode ? 'rgba(245, 158, 11, 0.1)'  : '#FFFBEB', color: '#F59E0B' },
        { label: 'About',             icon: 'information-circle-outline', screen: 'About',            bg: isDarkMode ? 'rgba(124, 58, 237, 0.1)'  : '#F5F3FF', color: '#7C3AED' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            {/* Header Section */}
            <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
                <Avatar 
                    name={user?.name} 
                    size={72} 
                    showBadge 
                    imageUri={user?.avatar}
                />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

                <View style={styles.headerStats}>
                    <View style={styles.headerStatItem}>
                        <Text style={styles.statValue}>{MOCK_STATS.scanned}</Text>
                        <Text style={styles.statLabel}>{t('scanned')}</Text>
                    </View>
                    <View style={styles.headerStatItem}>
                        <Text style={styles.statValue}>{MOCK_STATS.frauds}</Text>
                        <Text style={styles.statLabel}>{t('threats')}</Text>
                    </View>
                    <View style={styles.headerStatItem}>
                        <Text style={styles.statValue}>₹4.2k</Text>
                        <Text style={styles.statLabel}>{t('sent')}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
            </LinearGradient>

            {/* Menu Items */}
            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {menuItems.map((item, index) => {
                    const isActive = state.routes[state.index].name === item.screen || (item.screen === 'MainTabs' && state.routes[state.index].name === 'MainTabs');
                    
                    return (
                        <Pressable 
                            key={index}
                            onPress={() => navigation.navigate(item.screen)}
                            style={[
                                styles.menuItem,
                                isActive && { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }
                            ]}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: item.bg }]}>
                                <Ionicons name={item.icon} size={18} color={item.color} />
                            </View>
                            <Text style={[
                                styles.menuLabel,
                                { color: theme.colors.textPrimary },
                                isActive && { color: item.color, fontFamily: TYPOGRAPHY.fonts.bodyBold }
                            ]}>
                                {item.label}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={theme.colors.textHint} />
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Footer Section */}
            <View style={[styles.footer, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                <Pressable onPress={logout} style={styles.logoutBtn}>
                    <View style={[styles.logoutIcon, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                        <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
                    </View>
                    <Text style={[styles.logoutText, { color: theme.colors.error }]}>{t('logout')}</Text>
                </Pressable>
                <Text style={[styles.version, { color: theme.colors.textHint }]}>Vaultify v1.0.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    userName: {
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 12,
    },
    userEmail: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    headerStats: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 24,
    },
    headerStatItem: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontSize: 16,
        color: '#FFFFFF',
    },
    statLabel: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginTop: 20,
    },
    menuContainer: {
        flex: 1,
        paddingTop: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 14,
        borderRadius: 12,
        marginHorizontal: 12,
        marginBottom: 4
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 15,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 15,
    },
    version: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 11,
        textAlign: 'center',
        marginTop: 12,
    }
});
