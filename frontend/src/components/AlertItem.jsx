import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from './StatusBadge';

export default function AlertItem({ message, time, status = 'safe', onPress }) {
    const { theme } = useTheme();
    const config = {
        safe: { icon: 'checkmark-circle-outline', color: theme.colors.success, bg: theme.colors.success + '15' },
        suspicious: { icon: 'warning-outline', color: theme.colors.warning, bg: theme.colors.warning + '15' },
        fraud: { icon: 'close-circle-outline', color: theme.colors.error, bg: theme.colors.error + '15' },
    };

    const current = config[status] || config.safe;

    return (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                { 
                    backgroundColor: theme.colors.surface,
                    transform: [{ scale: pressed ? 0.98 : 1 }] 
                }
            ]}
        >
            <View style={[styles.iconCircle, { backgroundColor: current.bg }]}>
                <Ionicons name={current.icon} size={22} color={current.color} />
            </View>
            
            <View style={styles.content}>
                <Text style={[styles.message, { color: theme.colors.textPrimary }]} numberOfLines={1}>{message}</Text>
                <Text style={[styles.time, { color: theme.colors.textHint }]}>{time}</Text>
            </View>
            
            <StatusBadge status={status} showIcon={false} />
            
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textHint} style={styles.chevron} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.subtle,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    message: {
        fontFamily: TYPOGRAPHY.fonts.bodySemiBold,
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    time: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 12,
        color: COLORS.textHint,
        marginTop: 2,
    },
    chevron: {
        marginLeft: 8,
    }
});
