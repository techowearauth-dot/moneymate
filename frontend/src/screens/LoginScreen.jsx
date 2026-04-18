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

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleLogin = async () => {
        if (!email || !password) {
            setErrors({ 
                email: !email ? 'Email is required' : '', 
                password: !password ? 'Password is required' : '' 
            });
            return;
        }

        setLoading(true);
        try {
            const response = await authService.loginUser(email, password);
            const userData = response.data?.user || response.user;
            const accessToken = response.data?.accessToken || response.accessToken;
            const refreshToken = response.data?.refreshToken || response.refreshToken;
            await login(userData, accessToken, refreshToken);
        } catch (error) {
            setLoading(false);
            const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
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
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue protection</Text>
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

                        <Pressable 
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotBtn}
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </Pressable>

                        <AppButton 
                            title="Sign In" 
                            iconRight="log-in-outline"
                            loading={loading}
                            onPress={handleLogin}
                            style={styles.loginBtn}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Pressable onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerLink}>Create Account</Text>
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
        height: 280,
        paddingTop: 0,
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
        marginTop: 4,
    },
    keyboardView: {
        flex: 1,
        marginTop: -40, // Pull card up over gradient
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
        marginBottom: 20,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 28,
    },
    forgotText: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        fontSize: 14,
        color: COLORS.primary,
    },
    loginBtn: {
        marginBottom: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
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
