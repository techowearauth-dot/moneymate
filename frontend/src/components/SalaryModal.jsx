import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
    ActivityIndicator, Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, SHADOWS, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');

const SalaryModal = ({ visible, onSave }) => {
    const [salary, setSalary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const val = parseFloat(salary);
        if (isNaN(val) || val <= 0) {
            setError('Please enter a valid monthly salary');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await onSave(val);
        } catch (err) {
            setError('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <BlurView intensity={20} tint="dark" style={S.overlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.content}>
                    <View style={[S.card, SHADOWS.strong]}>
                        <View style={S.iconContainer}>
                            <Ionicons name="wallet-outline" size={32} color={COLORS.primary} />
                        </View>
                        
                        <Text style={S.title}>Monthly Salary</Text>
                        <Text style={S.subtitle}>
                            Please enter your monthly income to help us track your financial health.
                        </Text>

                        <View style={[S.inputWrap, error ? S.inputError : null]}>
                            <Text style={S.currency}>₹</Text>
                            <TextInput
                                style={S.input}
                                placeholder="e.g. 25000"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={salary}
                                onChangeText={(t) => {
                                    setSalary(t);
                                    if (error) setError('');
                                }}
                                autoFocus
                            />
                        </View>

                        {error ? <Text style={S.errorTxt}>{error}</Text> : null}

                        <TouchableOpacity 
                            style={[S.btn, loading ? S.btnDisabled : null]} 
                            onPress={handleSave}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={S.btnTxt}>Continue</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={S.footer}>This information is secure and private.</Text>
                    </View>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
};

const S = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: TYPOGRAPHY.fonts.heading,
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fonts.body,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 64,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputError: {
        borderColor: '#FCA5A5',
        backgroundColor: '#FFF1F1',
    },
    currency: {
        fontSize: 20,
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        color: '#475569',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
        color: '#1E293B',
    },
    errorTxt: {
        color: '#EF4444',
        fontSize: 12,
        fontFamily: TYPOGRAPHY.fonts.body,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    btn: {
        backgroundColor: COLORS.primary,
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnTxt: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fonts.bodyBold,
    },
    footer: {
        marginTop: 20,
        fontSize: 12,
        fontFamily: TYPOGRAPHY.fonts.body,
        color: '#94A3B8',
    }
});

export default SalaryModal;
