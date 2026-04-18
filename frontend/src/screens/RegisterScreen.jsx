import React, { useState, useContext } from 'react';
import { 
    View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
    ScrollView, Pressable, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS, GRADIENTS } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';

// Components
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import BackButton from '../components/BackButton';
import PasswordStrengthBar from '../components/PasswordStrengthBar';

export default function RegisterScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleRegister = async () => {
        let errs = {};
        if (!name) errs.name = 'Name is required';
        if (!email) errs.email = 'Email is required';
        if (!password) errs.password = 'Password is required';
        if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setLoading(true);
        try {
            const response = await authService.registerUser(name, email, password);
            const userData = response.data?.user || response.user;
            const accessToken = response.data?.accessToken || response.accessToken;
            const refreshToken = response.data?.refreshToken || response.refreshToken;
            await login(userData, accessToken, refreshToken);
        } catch (error) {
            setLoading(false);
            const msg = error.response?.data?.message || 'Registration failed';
            alert(msg);
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your security journey today</Text>
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
                        <AppInput 
                            label="Full Name"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={(t) => { setName(t); setErrors({ ...errors, name: '' }); }}
                            leftIcon="person-outline"
                            error={errors.name}
                            style={styles.input}
                        />

                        <AppInput 
                            label="Email Address"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setErrors({ ...errors, email: '' }); }}
                            keyboardType="email-address"
                            leftIcon="mail-outline"
                            error={errors.email}
                            style={styles.input}
                        />

                        <AppInput 
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrors({ ...errors, password: '' }); }}
                            secureTextEntry
                            showToggle
                            leftIcon="lock-closed-outline"
                            error={errors.password}
                            style={styles.input}
                        />

                        <PasswordStrengthBar password={password} />

                        <View style={{ height: 20 }} />

                        <AppInput 
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={(t) => { setConfirmPassword(t); setErrors({ ...errors, confirmPassword: '' }); }}
                            secureTextEntry
                            showToggle
                            leftIcon="lock-closed-outline"
                            error={errors.confirmPassword}
                            style={styles.input}
                        />

                        <AppButton 
                            title="Create Account" 
                            iconRight="person-add-outline"
                            loading={loading}
                            onPress={handleRegister}
                            style={styles.registerBtn}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerLink}>Sign In</Text>
                            </Pressable>
                        </View>
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
        paddingTop: 0,
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
    input: {
        marginBottom: 16,
    },
    registerBtn: {
        marginTop: 10,
        marginBottom: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 4,
    },
    footerText: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    footerLink: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        fontSize: 14,
        color: COLORS.primary,
    }
});
