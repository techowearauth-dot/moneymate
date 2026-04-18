import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Keyboard, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, SPACING, GRADIENTS } from '../constants/theme';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import BackButton from '../components/BackButton';
import PasswordStrengthBar from '../components/PasswordStrengthBar';
import { validatePassword } from '../utils/validators';
import { authService } from '../services/authService';

export default function ResetPasswordScreen({ route, navigation }) {
    const token = route.params?.token || '';
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!token) {
            alert('Invalid reset link. Missing token.');
        }
    }, [token]);

    const handleReset = async () => {
        Keyboard.dismiss();
        if (!token) return alert('Cannot reset without a valid token');

        const pwErr = validatePassword(password);
        const cpwErr = password !== confirmPassword ? 'Passwords do not match' : null;

        if (pwErr || cpwErr) {
            setErrors({ password: pwErr, confirmPassword: cpwErr });
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            await authService.resetPassword(token, password);
            alert('Password reset successful! Returning to login...');
            
            setTimeout(() => {
                navigation.navigate('Login');
            }, 2000);

        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reset password. Link may be expired.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient 
                colors={GRADIENTS.primary} 
                style={styles.headerBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <Pressable 
                            onPress={() => navigation.goBack()}
                            style={styles.backBtnWrapper}
                        >
                            <Ionicons name="chevron-back" size={28} color="white" />
                        </Pressable>
                        <View style={styles.logoBadge}>
                            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                        </View>
                    </View>
                    <View style={styles.welcomeTextGroup}>
                        <Text style={styles.title}>Secure Account</Text>
                        <Text style={styles.subtitle}>Set a strong new password for protection</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.formCard}>
                        <View style={styles.illustrationWrapper}>
                            <View style={styles.illustrationCircle}>
                                <Ionicons name="refresh-outline" size={40} color={COLORS.primary} />
                            </View>
                        </View>

                        <AppInput 
                            label="New Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrors({...errors, password: null}); }}
                            secureTextEntry={true}
                            showToggle={true}
                            leftIcon="lock-closed-outline"
                            error={errors.password}
                            style={styles.input}
                        />

                        <View style={{ marginVertical: 12 }}>
                            <PasswordStrengthBar password={password} />
                        </View>

                        <AppInput 
                            label="Confirm New Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={(t) => { setConfirmPassword(t); setErrors({...errors, confirmPassword: null}); }}
                            secureTextEntry={true}
                            showToggle={true}
                            leftIcon="lock-closed-outline"
                            error={errors.confirmPassword}
                            style={styles.input}
                        />

                        <AppButton 
                            title="Reset Password"
                            onPress={handleReset}
                            loading={loading}
                            iconRight="shield-checkmark-outline"
                            style={styles.submitButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerBackground: {
        height: 240,
    },
    headerContent: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    backBtnWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.subtle,
    },
    welcomeTextGroup: {
        marginTop: 10,
    },
    title: {
        fontFamily: TYPOGRAPHY.fonts.headingBold,
        fontSize: 32,
        color: COLORS.white,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    keyboardView: {
        flex: 1,
        marginTop: -30,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 28,
        padding: 24,
        ...SHADOWS.strong,
    },
    illustrationWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    illustrationCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        marginBottom: 16,
    },
    submitButton: {
        marginTop: 12,
    }
});
