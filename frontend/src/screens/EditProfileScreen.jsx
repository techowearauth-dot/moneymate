import React, { useState, useContext, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TextInput, ScrollView, 
    Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { RADIUS, TYPOGRAPHY, SPACING } from '../constants/theme';
import AppButton from '../components/AppButton';
import Avatar from '../components/Avatar';

export default function EditProfileScreen({ navigation }) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { user, updateUserProfile } = useContext(AuthContext);

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(user?.avatar || null);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('error'), 'Permission to access gallery is required');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('error'), 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await updateUserProfile({
                name: name.trim(),
                email: email.trim(),
                avatar: image
            });

            Alert.alert(t('success'), t('profileUpdated'), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert(t('error'), 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

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
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>{t('editProfile')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <Avatar name={name} size={120} imageUri={image} />
                            <Pressable style={styles.editBadge} onPress={handlePickImage}>
                                <Ionicons name="camera" size={20} color={COLORS.white} />
                            </Pressable>
                        </View>
                        <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>{t('changePhoto') || 'Change Photo'}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('name') || 'Full Name'}</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.textHint} />
                            <TextInput 
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.colors.textHint}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{t('email') || 'Email Address'}</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={theme.colors.textHint} />
                            <TextInput 
                                style={[styles.input, { color: theme.colors.textPrimary }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.colors.textHint}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

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
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative' },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white
    },
    changePhotoText: { 
        marginTop: 12, 
        fontFamily: TYPOGRAPHY.fonts.bodySemiBold, 
        fontSize: 14 
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
    saveBtn: { marginTop: 10 }
});
