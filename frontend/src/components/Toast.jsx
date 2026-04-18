import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ visible, message, type = 'error', onHide }) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    damping: 15,
                    stiffness: 100,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();

            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(({ finished }) => {
            if (finished && onHide && visible) { // Ensure hide hasn't explicitly been false
                onHide();
            }
        });
    };

    // Keep it mounted but invisible initially so we have dimensions for transform
    const borderColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B';
    const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity, borderLeftColor: borderColor }]}>
            <Ionicons name={iconName} size={24} color={borderColor} style={styles.icon} />
            <Text style={styles.text} numberOfLines={2}>
                {message || 'Notification'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 10,
    },
    icon: {
        marginRight: 12,
    },
    text: {
        flex: 1,
        fontFamily: 'DMSans_500Medium', // standard medium
        color: '#0F172A',
        fontSize: 14,
        lineHeight: 20,
    }
});
