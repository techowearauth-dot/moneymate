import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, ScrollView, 
    Pressable, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/theme';
import AppButton from '../components/AppButton';

export default function ChangePasswordScreen({ navigation }) {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert(t('error'), 'All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(t('error'), 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert(t('error'), 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            Alert.alert(t('success'), t('passwordChanged'), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert(t('error'), 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const PasswordInput = ({ label, value, setter, show, setShow, placeholder }) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textHint} />
                <TextInput 
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    value={value}
                    onChangeText={setter}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textHint}
                    secureTextEntry={!show}
                />
                <Pressable onPress={() => setShow(!show)} style={styles.eyeIcon}>
                    <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textHint} />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('changePassword')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.infoBox}>
                        <Ionicons name="shield-checkmark-outline" size={32} color={theme.colors.primary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            Update your password regularly to keep your account safe and secure.
                        </Text>
                    </View>

                    <PasswordInput 
                        label={t('currentPassword') || 'Current Password'}
                        value={currentPassword}
                        setter={setCurrentPassword}
                        show={showCurrent}
                        setShow={setShowCurrent}
                        placeholder="••••••••"
                    />

                    <PasswordInput 
                        label={t('newPassword') || 'New Password'}
                        value={newPassword}
                        setter={setNewPassword}
                        show={showNew}
                        setShow={setShowNew}
                        placeholder="••••••••"
                    />

                    <PasswordInput 
                        label={t('confirmNewPassword') || 'Confirm New Password'}
                        value={confirmPassword}
                        setter={setConfirmPassword}
                        show={showConfirm}
                        setShow={setShowConfirm}
                        placeholder="••••••••"
                    />

                    <AppButton 
                        title={t('save')}
                        onPress={handleSave}
                        loading={loading}
                        style={styles.saveBtn}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
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
    infoBox: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20
    },
    infoText: {
        textAlign: 'center',
        marginTop: 12,
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 14,
        lineHeight: 20
    },
    inputGroup: { marginBottom: 20 },
    inputLabel: { 
        fontFamily: TYPOGRAPHY.fonts.bodyMedium, 
        fontSize: 13, 
        marginBottom: 8,
        marginLeft: 4
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    input: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        fontFamily: TYPOGRAPHY.fonts.body,
        fontSize: 15,
    },
    eyeIcon: { padding: 4 },
    saveBtn: { marginTop: 10 }
});
