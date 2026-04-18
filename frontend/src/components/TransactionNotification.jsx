import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
    TouchableOpacity, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS } from '../constants/theme';
import { useSMSAnalytics } from '../context/SMSAnalyticsContext';

const { width } = Dimensions.get('window');
const NOTIFICATION_HEIGHT = 90;
const STATUS_BAR_OFFSET = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10;

const TransactionNotification = () => {
    const { lastNotification, clearNotification } = useSMSAnalytics();
    const slideAnim = useRef(new Animated.Value(-200)).current;

    console.log("[Notification] Render. lastNotification:", !!lastNotification);

    useEffect(() => {
        if (lastNotification) {
            console.log("[Notification] Sliding down for:", lastNotification.id || 'N/A');
            // Slide Down
            Animated.spring(slideAnim, {
                toValue: STATUS_BAR_OFFSET,
                useNativeDriver: true,
                bounciness: 8,
                speed: 12
            }).start();
        } else {
            // Slide Up
            Animated.timing(slideAnim, {
                toValue: -200,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [lastNotification]);

    if (!lastNotification) {
        return null;
    }

    // Safety: ensure type exists or fallback
    const type = lastNotification?.type || 'other';
    const isDebit = type === 'debit';
    const isCredit = type === 'credit';
    
    let accentColor = '#94A3B8'; // Gray for other
    let iconName = 'notifications-outline';
    let title = 'Smart Insight';

    if (isDebit) {
        accentColor = COLORS.error;
        iconName = 'arrow-up-circle';
        title = 'Money Debited';
    } else if (isCredit) {
        accentColor = COLORS.success;
        iconName = 'arrow-down-circle';
        title = 'Money Received';
    }

    const amount = lastNotification?.amount || 0;
    const merchant = lastNotification?.merchant || 'Unknown Entity';

    const Wrapper = Platform.OS === 'ios' ? BlurView : View;
    const wrapperProps = Platform.OS === 'ios' 
        ? { intensity: 80, tint: 'light' } 
        : { style: [S.blur, { backgroundColor: 'white', elevation: 5 }] };

    return (
        <Animated.View
            style={[
                S.container,
                SHADOWS.strong,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={clearNotification}
                style={S.touchable}
            >
                <Wrapper {...wrapperProps}>
                    <View style={[S.accentBar, { backgroundColor: accentColor }]} />
                    
                    <View style={S.content}>
                        <View style={[S.iconContainer, { backgroundColor: accentColor + '15' }]}>
                            <Ionicons name={iconName} size={24} color={accentColor} />
                        </View>
                        
                        <View style={S.textContainer}>
                            <View style={S.headerRow}>
                                <Text style={[S.title, { color: COLORS.textPrimary }]}>{title}</Text>
                                <Text style={S.time}>Just now</Text>
                            </View>
                            
                            <View style={S.detailRow}>
                                <Text style={S.merchant} numberOfLines={1}>
                                    {merchant}
                                </Text>
                                <Text style={[S.amount, { color: accentColor }]}>
                                    {isDebit ? '-' : isCredit ? '+' : ''}₹{typeof amount === 'number' ? amount.toLocaleString() : amount}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Wrapper>
            </TouchableOpacity>
        </Animated.View>
    );
};

const S = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    touchable: {
        width: '100%',
    },
    blur: {
        flexDirection: 'row',
        padding: 16,
        paddingLeft: 0,
        height: NOTIFICATION_HEIGHT,
    },
    accentBar: {
        width: 6,
        height: '100%',
        borderRadius: 3,
        marginLeft: 0,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 14,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    title: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.headingSemi,
    },
    time: {
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    merchant: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        maxWidth: '65%',
    },
    amount: {
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fonts.headingBold,
    },
});

export default TransactionNotification;
