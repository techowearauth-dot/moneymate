import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, RADIUS } from '../constants/theme';

export default function StatusBadge({ status = 'pending', showIcon = true }) {
    const config = {
        safe: {
            label: 'Safe',
            color: COLORS.success,
            bg: COLORS.successLight,
            icon: 'checkmark-circle'
        },
        suspicious: {
            label: 'Suspicious',
            color: COLORS.warning,
            bg: COLORS.warningLight,
            icon: 'warning'
        },
        fraud: {
            label: 'Fraud',
            color: COLORS.error,
            bg: COLORS.errorLight,
            icon: 'close-circle'
        },
        pending: {
            label: 'Scanning',
            color: COLORS.primary,
            bg: COLORS.primaryLight,
            icon: 'sync'
        },
        success: {
            label: 'Success',
            color: COLORS.success,
            bg: COLORS.successLight,
            icon: 'checkmark'
        },
        flagged: {
            label: 'Flagged',
            color: COLORS.error,
            bg: COLORS.errorLight,
            icon: 'flag'
        }
    };

    const current = config[status] || config.pending;

    return (
        <View style={[styles.badge, { backgroundColor: current.bg }]}>
            {showIcon && (
                <Ionicons 
                    name={current.icon} 
                    size={12} 
                    color={current.color} 
                    style={styles.icon}
                />
            )}
            <Text style={[styles.text, { color: current.color }]}>
                {current.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.full,
        alignSelf: 'flex-start',
    },
    icon: {
        marginRight: 5,
    },
    text: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});
