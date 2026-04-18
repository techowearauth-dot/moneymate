import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function SectionHeader({ title, actionLabel, onAction, style }) {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            {actionLabel && (
                <Pressable onPress={onAction} style={styles.actionBtn}>
                    <Text style={[styles.actionText, { color: theme.colors.primary }]}>{actionLabel}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.headingSemi,
        fontSize: 18,
    },
    actionBtn: {
        paddingVertical: 4,
        paddingLeft: 12,
    },
    actionText: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 13,
    }
});
