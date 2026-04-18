import React, { useState, useContext, useCallback, useMemo } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Pressable, 
    Switch, Alert, Modal, TextInput, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import AppButton from '../components/AppButton';

export default function SettingsScreen({ navigation }) {
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const { language, toggleLanguage, t } = useLanguage();
    const { user, updateUserProfile } = useContext(AuthContext);

    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [pending2FAValue, setPending2FAValue] = useState(false);

    // Settings State
    const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled || false);
    const [biometricsEnabled, setBiometricsEnabled] = useState(user?.biometricsEnabled || false);
    const [notifications, setNotifications] = useState(true);

    const handleToggleBiometrics = async (value) => {
        if (value) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                Alert.alert(t('error'), 'Biometric hardware not available or no fingerprints/face enrolled.');
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm Biometric Login',
                fallbackLabel: 'Enter Passcode',
            });

            if (result.success) {
                setBiometricsEnabled(true);
                updateUserProfile({ biometricsEnabled: true });
                Alert.alert(t('success'), 'Biometric login enabled');
            }
        } else {
            setBiometricsEnabled(false);
            updateUserProfile({ biometricsEnabled: false });
        }
    };

    const handleToggle2FA = (value) => {
        if (value) {
            setPending2FAValue(true);
            setOtpModalVisible(true);
            // Simulate sending OTP
            console.log('OTP sent to user email: 123456');
        } else {
            setTwoFAEnabled(false);
            updateUserProfile({ twoFAEnabled: false });
        }
    };

    const verifyOtp = async () => {
        setIsVerifyingOtp(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (otpValue === '123456') {
            setTwoFAEnabled(true);
            updateUserProfile({ twoFAEnabled: true });
            setOtpModalVisible(false);
            setOtpValue('');
            Alert.alert(t('success'), 'Two-Factor Authentication Enabled');
        } else {
            Alert.alert(t('error'), 'Incorrect OTP. Try again with 123456');
        }
        setIsVerifyingOtp(false);
    };

    const SettingRow = ({ icon, label, children, showDivider = true }) => (
        <View style={styles.settingRowWrapper}>
            <View style={styles.settingRow}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name={icon} size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
                {children}
            </View>
            {showDivider && <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />}
        </View>
    );

    const ChevronRow = ({ icon, label, value, onPress, showDivider = true }) => (
        <Pressable onPress={onPress} style={styles.settingRowWrapper}>
            <View style={styles.settingRow}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name={icon} size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
                <View style={styles.rowRight}>
                    {value && <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.textHint} />
                </View>
            </View>
            {showDivider && <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />}
        </Pressable>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('settings')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textHint }]}>{t('appSettings').toUpperCase()}</Text>
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <SettingRow icon="moon-outline" label={t('theme')}>
                        <Switch 
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: COLORS.disabled, true: theme.colors.primary }}
                            thumbColor={COLORS.white}
                        />
                    </SettingRow>
                    <ChevronRow 
                        icon="globe-outline" 
                        label={t('language')} 
                        value={language === 'en' ? 'English' : 'हिंदी'} 
                        onPress={() => {
                            Alert.alert(
                                t('language'),
                                'Choose your preferred language',
                                [
                                    { text: 'English', onPress: () => toggleLanguage('en') },
                                    { text: 'हिंदी', onPress: () => toggleLanguage('hi') },
                                ]
                            );
                        }}
                    />
                    <SettingRow icon="notifications-outline" label="Push Notifications" showDivider={false}>
                        <Switch 
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </SettingRow>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.textHint, marginTop: 24 }]}>{t('securitySettings').toUpperCase()}</Text>
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <SettingRow icon="lock-closed-outline" label={t('twoFactor')}>
                        <Switch 
                            value={twoFAEnabled}
                            onValueChange={handleToggle2FA}
                            trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </SettingRow>
                    <SettingRow icon="finger-print-outline" label={t('biometrics')}>
                        <Switch 
                            value={biometricsEnabled}
                            onValueChange={handleToggleBiometrics}
                            trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </SettingRow>
                    <ChevronRow 
                        icon="key-outline" 
                        label={t('changePassword')} 
                        onPress={() => navigation.navigate('ChangePassword')} 
                        showDivider={false} 
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.colors.textHint, marginTop: 24 }]}>ABOUT</Text>
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <ChevronRow icon="information-circle-outline" label="Version" value="1.0.0" onPress={() => {}} />
                    <ChevronRow icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
                    <ChevronRow icon="shield-outline" label="Privacy Policy" onPress={() => {}} showDivider={false} />
                </View>
            </ScrollView>

            {/* OTP MODAL */}
            <Modal
                visible={otpModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setOtpModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Verify OTP</Text>
                            <Pressable onPress={() => setOtpModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </Pressable>
                        </View>
                        <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]}>
                            A 6-digit code has been sent to your registered email. Enter it below to enable 2FA (Hint: 123456).
                        </Text>
                        
                        <TextInput 
                            style={[styles.otpInput, { 
                                color: theme.colors.textPrimary, 
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border
                            }]}
                            value={otpValue}
                            onChangeText={setOtpValue}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="000000"
                            placeholderTextColor={theme.colors.textHint}
                        />

                        <AppButton 
                            title="Verify & Enable"
                            onPress={verifyOtp}
                            loading={isVerifyingOtp}
                            style={styles.verifyBtn}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 10,
        paddingVertical: 10
    },
    backBtn: { padding: 10 },
    headerTitle: { fontFamily: TYPOGRAPHY.fonts.heading, fontSize: 18 },
    content: { padding: 20 },
    sectionTitle: { 
        fontFamily: TYPOGRAPHY.fonts.bodyBold, 
        fontSize: 12, 
        letterSpacing: 1.2, 
        marginBottom: 12,
        marginLeft: 4
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        ...SHADOWS.soft,
        shadowOpacity: 0.05
    },
    settingRowWrapper: { width: '100%' },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    settingLabel: {
        flex: 1,
        fontFamily: TYPOGRAPHY.fonts.bodyMedium,
        fontSize: 15,
        marginLeft: 16
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    rowValue: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14
    },
    divider: {
        height: 1,
        marginLeft: 76
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        ...SHADOWS.strong
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontFamily: TYPOGRAPHY.fonts.heading,
        fontSize: 20
    },
    modalDesc: {
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24
    },
    otpInput: {
        height: 60,
        borderRadius: 16,
        borderWidth: 2,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: TYPOGRAPHY.fonts.headingSemi,
        letterSpacing: 8,
        marginBottom: 24
    },
    verifyBtn: {
        width: '100%'
    }
});
