import React, { useRef } from 'react';
import { 
    Text, StyleSheet, Pressable, Animated, 
    ActivityIndicator, View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, BUTTON, GRADIENTS } from '../constants/theme';

export default function AppButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size = 'lg',       // 'lg' | 'md' | 'sm'
    icon,
    iconRight,
    iconSize: customIconSize,
    fullWidth = true,
    style,
    textStyle,
    gradient: customGradient,
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
        Animated.spring(scaleAnim, { 
            toValue: 0.96, 
            useNativeDriver: true, 
            speed: 50 
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { 
            toValue: 1.0, 
            useNativeDriver: true, 
            speed: 30, 
            bounciness: 6 
        }).start();
    };

    const isDisabled = disabled || loading;

    // Resolve specific values based on size
    const sizeConfig = {
        lg: { height: BUTTON.heightLg, radius: BUTTON.radiusLg, fontSize: 16, iconSize: 20, paddingH: 24 },
        md: { height: BUTTON.heightMd, radius: BUTTON.radiusMd, fontSize: 15, iconSize: 18, paddingH: 20 },
        sm: { height: BUTTON.heightSm, radius: BUTTON.radiusSm, fontSize: 13, iconSize: 16, paddingH: 14 },
    };
    const { height, radius, fontSize, iconSize: defaultIconSize, paddingH } = sizeConfig[size];
    const iconSize = customIconSize || defaultIconSize;

    // Resolve styles based on variant
    const getVariantStyles = () => {
        if (isDisabled) {
            return {
                bg: COLORS.surfaceAlt,
                text: COLORS.disabled,
                border: COLORS.border,
                shadow: {},
                isGradient: false
            };
        }

        switch (variant) {
            case 'primary':
                return {
                    bg: customGradient || GRADIENTS.primary,
                    text: COLORS.white,
                    border: 'transparent',
                    shadow: SHADOWS.medium, // Using medium shadow for premium feel
                    isGradient: true
                };
            case 'secondary':
                return {
                    bg: COLORS.primaryLight,
                    text: COLORS.primary,
                    border: 'transparent',
                    shadow: {},
                    isGradient: false
                };
            case 'outline':
                return {
                    bg: COLORS.white,
                    text: COLORS.primary,
                    border: COLORS.primary,
                    shadow: {},
                    isGradient: false
                };
            case 'ghost':
                return {
                    bg: 'transparent',
                    text: COLORS.primary,
                    border: 'transparent',
                    shadow: {},
                    isGradient: false
                };
            case 'danger':
                return {
                    bg: ['#EF4444', '#B91C1C'],
                    text: COLORS.white,
                    border: 'transparent',
                    shadow: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
                    isGradient: true
                };
            default:
                return {
                    bg: COLORS.primary,
                    text: COLORS.white,
                    border: 'transparent',
                    shadow: SHADOWS.soft,
                    isGradient: false
                };
        }
    };

    const vStyles = getVariantStyles();

    return (
        <Animated.View style={[
            styles.container,
            { 
                width: fullWidth ? '100%' : 'auto',
                transform: [{ scale: scaleAnim }],
                ...vStyles.shadow
            },
            style
        ]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                style={({ pressed }) => [
                    styles.pressable,
                    { 
                        height, 
                        borderRadius: radius,
                        opacity: pressed ? 0.9 : 1
                    }
                ]}
            >
                {vStyles.isGradient ? (
                    <LinearGradient
                        colors={vStyles.bg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                ) : (
                    <View style={[
                        StyleSheet.absoluteFill, 
                        { 
                            backgroundColor: vStyles.bg, 
                            borderWidth: variant === 'outline' ? 1.5 : 0,
                            borderColor: vStyles.border
                        }
                    ]} />
                )}
                
                <View style={[styles.content, { paddingHorizontal: paddingH }]}>
                    {loading ? (
                        <ActivityIndicator size="small" color={vStyles.text} />
                    ) : (
                        <>
                            {icon && <Ionicons name={icon} size={iconSize} color={vStyles.text} style={styles.icon} />}
                            <Text style={[
                                styles.text, 
                                { 
                                    color: vStyles.text, 
                                    fontSize, 
                                    fontFamily: TYPOGRAPHY.fonts.bodyBold 
                                },
                                textStyle
                            ]}>
                                {title}
                            </Text>
                            {iconRight && <Ionicons name={iconRight} size={iconSize} color={vStyles.text} style={styles.iconRight} />}
                        </>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'visible',
    },
    pressable: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 10,
    },
    iconRight: {
        marginLeft: 10,
    },
    text: {
        textAlign: 'center',
    }
});
