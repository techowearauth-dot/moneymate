import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import Animated, { FadeIn, FadeOut, ScaleInCenter, ScaleOutCenter, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { voiceService } from '../services/voiceService';

const { width, height } = Dimensions.get('window');

/**
 * VoiceAssistant Component - Handles recording, STT, backend intent parsing, and TTS feedback.
 */
export default function VoiceAssistant({ visible, onClose }) {
    const navigation = useNavigation();
    const [recognizedText, setRecognizedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState('');

    const pulseValue = useSharedValue(1);

    useEffect(() => {
        // Setup Voice listeners
        Voice.onSpeechStart = () => {
            setIsListening(true);
            setError('');
        };
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechResults = (e) => {
            if (e.value && e.value.length > 0) {
                setRecognizedText(e.value[0]);
            }
        };
        Voice.onSpeechError = (e) => {
            console.error('[Voice] Error:', e.error);
            setError('Speech not recognized. Try again.');
            setIsListening(false);
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    useEffect(() => {
        if (visible) {
            startListening();
            pulseValue.value = withRepeat(
                withSequence(withTiming(1.2, { duration: 600 }), withTiming(1, { duration: 600 })),
                -1, true
            );
        } else {
            stopListening();
            pulseValue.value = 1;
        }
    }, [visible]);

    const startListening = async () => {
        try {
            setRecognizedText('');
            setError('');
            await Voice.start('en-US'); // Gemini handles Hinglish even if locale is en-US
        } catch (e) {
            console.error('[Voice] Start Error:', e);
        }
    };

    const stopListening = async () => {
        try {
            setIsListening(false);
            await Voice.stop();
            // Process the text after recording stops
            if (recognizedText) {
                handleProcessCommand(recognizedText);
            }
        } catch (e) {
            console.error('[Voice] Stop Error:', e);
        }
    };

    const handleProcessCommand = async (text) => {
        setIsProcessing(true);
        try {
            const res = await voiceService.sendCommand(text);
            
            // 1. Speak the response
            Speech.speak(res.message, { 
                pitch: 1.0, 
                rate: 1.0,
                onDone: () => {
                    // 2. Action based navigation/UI
                    if (res.action === 'EMERGENCY' || res.action === 'SHOW_ALERTS') {
                        navigation.navigate('DrawerRoot', { screen: 'Security Hub' });
                    }
                    setTimeout(onClose, 1000);
                }
            });

        } catch (e) {
            setError('Something went wrong processing your request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const animatedPulse = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        backgroundColor: isListening ? COLORS.primary : COLORS.textHint
    }));

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
                
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
                    <View style={styles.sheet}>
                        <Text style={styles.statusText}>
                            {isProcessing ? 'Thinking...' : isListening ? 'Listening...' : 'Thinking...'}
                        </Text>
                        
                        <View style={styles.micCircleContainer}>
                            <Animated.View style={[styles.micPulse, animatedPulse]} />
                            <View style={[styles.micIconInner, { backgroundColor: isListening ? COLORS.primary : COLORS.surfaceAlt }]}>
                                <Ionicons name="mic" size={40} color="white" />
                            </View>
                        </View>

                        <Text style={styles.recognizedText}>
                            {recognizedText || 'Speak now...'}
                        </Text>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {!isListening && !isProcessing && (
                            <TouchableOpacity style={styles.retryBtn} onPress={startListening}>
                                <Text style={styles.retryTxt}>Try Again</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
    content: { width: '100%', alignItems: 'center' },
    sheet: {
        width: width,
        backgroundColor: 'white',
        borderTopLeftRadius: RADIUS.xxl,
        borderTopRightRadius: RADIUS.xxl,
        padding: 30,
        paddingBottom: 60,
        alignItems: 'center',
        ...SHADOWS.medium
    },
    statusText: { fontSize: 13, fontFamily: TYPOGRAPHY.fonts.bodyBold, color: COLORS.textHint, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 30 },
    micCircleContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    micPulse: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.3 },
    micIconInner: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 5, ...SHADOWS.button },
    recognizedText: { fontSize: 18, fontFamily: TYPOGRAPHY.fonts.headingSemi, color: COLORS.textPrimary, textAlign: 'center', paddingHorizontal: 20 },
    errorText: { color: COLORS.error, fontSize: 12, marginTop: 10, fontFamily: TYPOGRAPHY.fonts.bodyMedium },
    retryBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: COLORS.surfaceAlt },
    retryTxt: { color: COLORS.primary, fontSize: 14, fontFamily: TYPOGRAPHY.fonts.bodyBold }
});
