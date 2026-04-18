import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { RADIUS } from '../constants/theme';

/**
 * A premium reusable glassmorphism container using Expo Blur.
 */
const GlassCard = ({ 
    children, 
    intensity = 40, 
    borderRadius = RADIUS.xl, 
    style,
    tint
}) => {
    const { isDarkMode } = useTheme();
    
    // Choose appropriate tint based on theme if not provided
    const defaultTint = tint || (isDarkMode ? 'dark' : 'light');

    return (
        <View style={[styles.container, { borderRadius }, style]}>
            <BlurView
                intensity={intensity}
                tint={defaultTint}
                style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            <View style={[styles.content, { borderRadius }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 242, 255, 0.35)',
        backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    content: {
        flex: 1,
    }
});

export default GlassCard;
