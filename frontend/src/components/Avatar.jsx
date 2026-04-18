import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, GRADIENTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function Avatar({
    name,
    imageUri,
    size = 48,
    showBadge = false,
    badgeColor = '#10B981',
    onPress,
    style,
}) {
    const { theme } = useTheme();
    const initials = (typeof name === 'string' && name.trim())
        ? name
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()
        : 'U';

    const Container = onPress ? Pressable : View;
    const badgeSize = size * 0.25;

    return (
        <Container 
            onPress={onPress}
            style={[
                styles.container, 
                { width: size, height: size }, 
                style
            ]}
        >
            <View style={[
                styles.avatarWrapper, 
                { 
                    borderRadius: size / 2, 
                    width: size, 
                    height: size,
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.white
                }
            ]}>
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={[styles.image, { borderRadius: size / 2 }]}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <LinearGradient
                        colors={GRADIENTS.primary}
                        style={[styles.gradient, { borderRadius: size / 2 }]}
                    >
                        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
                            {initials}
                        </Text>
                    </LinearGradient>
                )}
            </View>

            {showBadge && (
                <View style={[
                    styles.badge, 
                    { 
                        width: badgeSize, 
                        height: badgeSize, 
                        borderRadius: badgeSize / 2,
                        backgroundColor: badgeColor,
                        bottom: 0,
                        right: 0,
                    }
                ]} />
            )}
        </Container>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        ...SHADOWS.subtle,
    },
    avatarWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontFamily: TYPOGRAPHY.fonts.headingBold,
        color: COLORS.white,
    },
    badge: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: COLORS.white,
    }
});
