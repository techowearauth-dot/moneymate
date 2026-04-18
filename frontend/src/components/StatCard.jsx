import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ 
    icon, 
    iconBg, 
    iconColor, 
    value, 
    label, 
    animated = true 
}) {
    const { theme } = useTheme();
    const [displayValue, setDisplayValue] = useState(0);
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();

        if (animated) {
            let start = 0;
            const end = parseInt(value);
            if (isNaN(end) || end === 0) return setDisplayValue(value);
            
            const duration = 1200;
            const increment = end / (duration / 16);
            
            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setDisplayValue(end);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(start));
                }
            }, 16);
            
            return () => clearInterval(timer);
        } else {
            setDisplayValue(value);
        }
    }, [value, animated]);

    return (
        <Animated.View style={[
            styles.card, 
            { 
                opacity: opacityAnim, 
                backgroundColor: theme.colors.surface,
                transform: [{ scale: scaleAnim }],
                shadowColor: theme.mode === 'dark' ? '#000' : theme.colors.primary,
            }
        ]}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text style={[styles.valueText, { color: theme.colors.textPrimary }]}>{displayValue}</Text>
            <Text style={[styles.labelText, { color: theme.colors.textHint }]}>{label}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: RADIUS.xl,
        padding: 14,
        alignItems: 'center',
        ...SHADOWS.soft,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueText: {
        fontFamily: TYPOGRAPHY.fonts.headingBold,
        fontSize: 22,
        marginTop: 10,
    },
    labelText: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 12,
        marginTop: 2,
    }
});
