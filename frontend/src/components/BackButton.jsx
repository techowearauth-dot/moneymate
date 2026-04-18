import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { RADIUS, SHADOWS } from '../constants/theme';

export default function BackButton({ style, onPress }) {
    const navigation = useNavigation();
    
    return (
        <Pressable
            onPress={onPress || (() => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }
            })}
            style={({ pressed }) => [
                styles.button,
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
                style
            ]}
        >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.subtle,
    }
});
