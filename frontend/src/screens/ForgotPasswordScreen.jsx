import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, SPACING, GRADIENTS } from '../constants/theme';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import BackButton from '../components/BackButton';
import { validateEmail } from '../utils/validators';
import { authService } from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSendLink = async () => {
        Keyboard.dismiss();
        const emErr = validateEmail(email);
        if (emErr) {
            setError(emErr);
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to send reset link.';
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
                        <Text style={styles.title}>{success ? 'Check Mail' : 'Reset Password'}</Text>
                        <Text style={styles.subtitle}>
                            {success ? 'We sent instructions to your email' : 'No worries! We will send you a reset link'}
                        </Text>
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
                        {success ? (
                            <View style={styles.successContent}>
                                <View style={styles.successIconOuter}>
                                    <Ionicons name="mail-unread-outline" size={80} color={COLORS.primary} />
                                </View>
                                <Text style={styles.successText}>
                                    Check your inbox for the reset link. It expires in 10 minutes.
                                </Text>
                                <AppButton 
                                    title="Back to Login" 
                                    variant="outline"
                                    onPress={() => navigation.navigate('Login')}
                                    style={styles.backButton}
                                />
                            </View>
                        ) : (
                            <>
                                <View style={styles.illustrationWrapper}>
                                    <View style={styles.illustrationCircle}>
                                        <Ionicons name="key-outline" size={40} color={COLORS.primary} />
                                    </View>
                                </View>

                                <AppInput 
                                    label="Email Address"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setError(null); }}
                                    keyboardType="email-address"
                                    leftIcon="mail-outline"
                                    error={error}
                                    style={styles.input}
                                />

                                <AppButton 
                                    title="Send reset link"
                                    onPress={handleSendLink}
                                    loading={loading}
                                    iconRight="mail-outline"
                                    style={styles.submitButton}
                                />
                            </>
                        )}
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
        height: 280,
    },
    headerContent: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 60,
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
        marginTop: 20,
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
        marginTop: 8,
        lineHeight: 22,
    },
    keyboardView: {
        flex: 1,
        marginTop: -40,
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
        minHeight: 300,
    },
    illustrationWrapper: {
        alignItems: 'center',
        marginBottom: 32,
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
        marginBottom: 24,
    },
    submitButton: {
        marginTop: 8,
    },
    successContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIconOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successText: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    backButton: {
        width: '100%',
    }
});
