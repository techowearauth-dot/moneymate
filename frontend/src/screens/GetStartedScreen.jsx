import React, { useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, Animated, 
    SafeAreaView, StatusBar, Pressable, Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, GRADIENTS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

// Components
import AppButton from '../components/AppButton';

const { width, height } = Dimensions.get('window');

export default function GetStartedScreen({ navigation }) {
    // Animation Values
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUp, { toValue: 0, duration: 800, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            
            <LinearGradient 
                colors={['#EEF2FF', '#FFFFFF', '#F8FAFC']} 
                style={StyleSheet.absoluteFill} 
            />

            <SafeAreaView style={styles.content}>
                <View style={styles.heroSection}>
                    <Animated.View style={[
                        styles.logoWrapper,
                        { 
                            opacity: opacity,
                            transform: [{ scale: logoScale }]
                        }
                    ]}>
                        <LinearGradient 
                            colors={GRADIENTS.primary} 
                            style={styles.logoSquare}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="shield-checkmark" size={40} color="white" />
                        </LinearGradient>
                        <View style={styles.logoShadow} />
                    </Animated.View>

                    <Animated.View style={{ 
                        opacity: opacity, 
                        transform: [{ translateY: slideUp }], 
                        alignItems: 'center',
                        marginTop: 40
                    }}>
                        <Text style={styles.appName}>Vaultify</Text>
                        <Text style={styles.tagline}>Your AI-powered security companion</Text>
                        
                        <View style={styles.premiumDivider} />
                    </Animated.View>
                </View>

                <Animated.View style={[
                    styles.bottomSection,
                    { opacity: opacity, transform: [{ translateY: slideUp }] }
                ]}>
                    <View style={styles.featuresRow}>
                        <FeatureItem icon="shield-checkmark" text="Secure" />
                        <FeatureItem icon="flash" text="Fast" />
                        <FeatureItem icon="finger-print" text="Private" />
                    </View>

                    <AppButton 
                        title="Get Started" 
                        onPress={() => navigation.navigate('Register')} 
                        iconRight="arrow-forward-outline" 
                        style={styles.mainBtn}
                    />

                    <Pressable onPress={() => navigation.navigate('Login')} style={styles.signInLink}>
                        <Text style={styles.signInText}>
                            Already have an account? <Text style={styles.signInBold}>Sign In</Text>
                        </Text>
                    </Pressable>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const FeatureItem = ({ icon, text }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIconBg}>
            <Ionicons name={icon} size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const FeaturePill = ({ icon, color, text }) => (
    <View style={styles.pill}>
        <Ionicons name={icon} size={12} color={color} />
        <Text style={styles.pillText}>{text}</Text>
    </View>
);

const TrustItem = ({ icon, color, text }) => (
    <View style={styles.trustItem}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.trustText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    heroSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    logoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoSquare: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    logoShadow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        opacity: 0.2,
        bottom: -10,
        transform: [{ scale: 1.1 }],
        zIndex: 1,
    },
    appName: {
        fontFamily: TYPOGRAPHY.fonts.headingBold,
        fontSize: 42,
        color: COLORS.textPrimary,
        letterSpacing: -1,
    },
    tagline: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        maxWidth: 240,
        lineHeight: 24,
    },
    premiumDivider: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primaryLight,
        marginTop: 24,
    },
    bottomSection: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    featuresRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 40,
    },
    featureItem: {
        alignItems: 'center',
        gap: 8,
    },
    featureIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.subtle,
    },
    featureText: {
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 11,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mainBtn: {
        borderRadius: 20,
        ...SHADOWS.medium,
    },
    signInLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    signInText: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    signInBold: {
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        color: COLORS.primary,
    }
});
