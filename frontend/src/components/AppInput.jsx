import React, { useRef, useState } from 'react';
import { 
    View, Text, TextInput, StyleSheet, Animated, 
    Pressable, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, RADIUS, SPACING, INPUT } from '../constants/theme';

export default function AppInput({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    secureTextEntry,
    showToggle,
    keyboardType,
    autoCapitalize = 'none',
    leftIcon,
    rightIcon,
    editable = true,
    onSubmitEditing,
    returnKeyType,
    blurOnSubmit = false,
    multiline = false,
    style,
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
    
    // Animation for focus effect
    const focusAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? COLORS.error : COLORS.border, COLORS.primary],
    });

    const backgroundColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.white, COLORS.white], // Keeping it white for consistency
    });

    const elevation = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 2],
    });

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <Animated.View style={[
                styles.inputWrapper,
                { 
                    borderColor, 
                    backgroundColor,
                    height: multiline ? 120 : INPUT.height,
                    alignItems: multiline ? 'flex-start' : 'center',
                    paddingTop: multiline ? 12 : 0,
                    // Shadow for focus
                    shadowColor: COLORS.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: focusAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.1],
                    }),
                    shadowRadius: 4,
                    elevation,
                }
            ]}>
                {leftIcon && (
                    <Ionicons 
                        name={leftIcon} 
                        size={INPUT.iconSize} 
                        color={isFocused ? COLORS.primary : COLORS.textHint} 
                        style={styles.leftIcon}
                    />
                )}
                
                <TextInput
                    style={[
                        styles.input,
                        { 
                            paddingTop: multiline && Platform.OS === 'android' ? 0 : 0,
                            textAlignVertical: multiline ? 'top' : 'center',
                        }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textHint}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType={returnKeyType}
                    blurOnSubmit={blurOnSubmit}
                    multiline={multiline}
                />
                
                {showToggle && (
                    <Pressable 
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.rightIcon}
                    >
                        <Ionicons 
                            name={isPasswordVisible ? "eye-off" : "eye"} 
                            size={INPUT.iconSize} 
                            color={COLORS.textHint} 
                        />
                    </Pressable>
                )}

                {rightIcon && !showToggle && (
                    <Ionicons 
                        name={rightIcon} 
                        size={INPUT.iconSize} 
                        color={COLORS.textHint} 
                        style={styles.rightIcon}
                    />
                )}
            </Animated.View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: TYPOGRAPHY.sizes.small,
        color: COLORS.textPrimary,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        borderRadius: INPUT.borderRadius,
        borderWidth: INPUT.borderWidth,
        flexDirection: 'row',
        paddingHorizontal: INPUT.paddingH,
        overflow: 'hidden',
    },
    leftIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: TYPOGRAPHY.sizes.body,
        color: COLORS.textPrimary,
        height: '100%',
    },
    rightIcon: {
        padding: 4,
        marginLeft: 8,
    },
    errorText: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: TYPOGRAPHY.sizes.tiny,
        color: COLORS.error,
        marginTop: 6,
        marginLeft: 4,
    }
});
