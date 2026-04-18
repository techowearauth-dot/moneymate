import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SMSService from '../services/SMSService';
import { securityService } from '../services/securityService';

const SMSAnalyticsContext = createContext();

export const SMSAnalyticsProvider = ({ children }) => {
    const { user, updateUserProfile } = useContext(AuthContext);
    console.log("[SMSContext] Initialization - Current User:", user?.name, "Salary:", user?.salary);

    const [smsAnalytics, setSmsAnalytics] = useState({
        total: 0,
        debitCount: 0,
        creditCount: 0,
        otherCount: 0,
        debitAmount: 0,
        creditAmount: 0,
        balance: 0,
        messages: [] // FINANCIAL ONLY
    });

    const [spamMessages, setSpamMessages] = useState([]);
    const [ecommerceMessages, setEcommerceMessages] = useState([]);
    const [otpMessages, setOtpMessages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [lastNotification, setLastNotification] = useState(null);
    const [isFraudDetectionEnabled, setIsFraudDetectionEnabled] = useState(false);
    const [fraudAlerts, setFraudAlerts] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const lastProcessedTime = useRef({});

    /**
     * Persistence: Load data from AsyncStorage on init
     */
    useEffect(() => {
        const initData = async () => {
            try {
                const [spam, eco, otp] = await Promise.all([
                    AsyncStorage.getItem('@sms_spam'),
                    AsyncStorage.getItem('@sms_ecommerce'),
                    AsyncStorage.getItem('@sms_otp')
                ]);
                
                const now = Date.now();
                
                // Parse and filter expired messages
                if (spam) {
                    const parsed = JSON.parse(spam).filter(m => m.expiresAt > now);
                    setSpamMessages(parsed);
                }
                if (eco) setEcommerceMessages(JSON.parse(eco));
                if (otp) {
                    const parsed = JSON.parse(otp).filter(m => m.expiresAt > now);
                    setOtpMessages(parsed);
                }
            } catch (e) {
                console.error("[SMSContext] Error loading persisted data:", e);
            } finally {
                setIsDataLoaded(true);
            }
        };
        initData();
    }, []);

    /**
     * Persistence: Save to AsyncStorage when state changes
     */
    useEffect(() => {
        if (!isDataLoaded) return;
        AsyncStorage.multiSet([
            ['@sms_spam', JSON.stringify(spamMessages)],
            ['@sms_ecommerce', JSON.stringify(ecommerceMessages)],
            ['@sms_otp', JSON.stringify(otpMessages)]
        ]);
    }, [spamMessages, ecommerceMessages, otpMessages, isDataLoaded]);

    /**
     * Strict Cleanup: Recurring check for expired items (every 1 min)
     */
    useEffect(() => {
        const cleanup = () => {
            const now = Date.now();
            setSpamMessages(prev => {
                const filtered = prev.filter(m => m.expiresAt > now);
                return filtered.length === prev.length ? prev : filtered;
            });
            setOtpMessages(prev => {
                const filtered = prev.filter(m => m.expiresAt > now);
                return filtered.length === prev.length ? prev : filtered;
            });
        };

        const interval = setInterval(cleanup, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    /**
     * Helper to remove a specific message from a category.
     */
    const removeMessage = useCallback((id, category) => {
        if (category === 'spam') setSpamMessages(prev => prev.filter(m => m.id !== id));
        else if (category === 'otp') setOtpMessages(prev => prev.filter(m => m.id !== id));
        else if (category === 'ecommerce') setEcommerceMessages(prev => prev.filter(m => m.id !== id));
    }, []);

    const clearCategory = useCallback((category) => {
        if (category === 'spam') setSpamMessages([]);
        else if (category === 'otp') setOtpMessages([]);
        else if (category === 'ecommerce') setEcommerceMessages([]);
    }, []);

    /**
     * Integrates a new analyzed SMS into the global state with smart filtering.
     */
    const addMessage = useCallback(async (analyzedMsg) => {
        if (!analyzedMsg) return;

        try {
            const now = Date.now();
            const text = analyzedMsg.original_sms || analyzedMsg.text || 'unknown';
            const classification = SMSService.classifySMS(text);
            
            if (lastProcessedTime.current[text] && (now - lastProcessedTime.current[text] < 2000)) return;
            lastProcessedTime.current[text] = now;

            const { generateTxId } = require('../utils/txUtils');
            const msgId = analyzedMsg.id || generateTxId(analyzedMsg);

            // Determine Expiry
            let expiresAt = Infinity; // Ecommerce never expires
            if (classification === 'otp') expiresAt = now + (15 * 60 * 1000); // 15 mins
            if (classification === 'spam') expiresAt = now + (60 * 60 * 1000); // 1 hour

            const msgWithMeta = {
                ...analyzedMsg,
                id: msgId,
                text,
                sender: analyzedMsg.sender || 'System',
                timestamp: now,
                date: analyzedMsg.date || now,
                classification,
                expiresAt
            };

            if (classification === 'financial') {
                let refinedMsg = analyzedMsg;
                if (analyzedMsg.type !== 'other' && !analyzedMsg.anomalyReason) {
                    const history = smsAnalytics.messages || [];
                    const contextResult = await SMSService.analyzeContextual(text, history);
                    if (contextResult) refinedMsg = { ...analyzedMsg, ...contextResult };
                }

                if (isFraudDetectionEnabled) {
                    securityService.analyzeSms(text).catch(e => console.error('[SMSContext] Backend analysis failed:', e));
                }

                const msgWithFinancials = {
                    ...msgWithMeta,
                    ...refinedMsg,
                    category: refinedMsg.category || SMSService.detectCategory(text),
                    merchant: refinedMsg.merchant || 'Unknown Merchant',
                };

                setSmsAnalytics(prev => {
                    const exists = prev.messages.some(m => m.id === msgWithFinancials.id);
                    if (exists) return prev;

                    const updatedMessages = [msgWithFinancials, ...(prev.messages || [])];
                    return SMSService.processAnalytics(updatedMessages);
                });
            } else if (classification === 'otp') {
                setOtpMessages(prev => [msgWithMeta, ...prev.slice(0, 49)]);
            } else if (classification === 'ecommerce') {
                setEcommerceMessages(prev => [msgWithMeta, ...prev.slice(0, 49)]);
            } else {
                setSpamMessages(prev => [msgWithMeta, ...prev.slice(0, 49)]);
            }

            setLastNotification({ ...msgWithMeta, timestamp: now });
            setTimeout(() => {
                setLastNotification(prev => (prev?.timestamp === now ? null : prev));
            }, 3500);
        } catch (err) {
            console.error("[SMSContext] Error in addMessage:", err);
        }
    }, [smsAnalytics, isFraudDetectionEnabled]);

const triggerManualSync = useCallback(async () => {
    setLoading(true);
    try {
        const deviceMessages = await SMSService.fetchDeviceSMS();
        if (deviceMessages && deviceMessages.length > 0) {
            const analyzed = await SMSService.analyzeMessages(deviceMessages);
            const now = Date.now();
            
            const financial = [];
            const spam = [];
            const ecommerce = [];
            const otp = [];

            analyzed.forEach(msg => {
                const text = msg.text || msg.body;
                const cat = SMSService.classifySMS(text);
                const msgId = msg.id || Math.random().toString();
                
                if (cat === 'financial') financial.push(msg);
                else {
                    const expiresAt = cat === 'otp' ? now + (15 * 60 * 1000) : (cat === 'spam' ? now + (60 * 60 * 1000) : Infinity);
                    const metaMsg = { ...msg, text, id: msgId, timestamp: now, classification: cat, expiresAt };
                    if (cat === 'spam') spam.push(metaMsg);
                    else if (cat === 'ecommerce') ecommerce.push(metaMsg);
                    else if (cat === 'otp') otp.push(metaMsg);
                }
            });

            if (financial.length > 0) setSmsAnalytics(SMSService.processAnalytics(financial));
            setSpamMessages(prev => [...spam, ...prev].slice(0, 50));
            setEcommerceMessages(prev => [...ecommerce, ...prev].slice(0, 50));
            setOtpMessages(prev => [...otp, ...prev].slice(0, 50));
        }
    } catch (err) {
        console.error('[SMSContext] Manual sync failed:', err);
    } finally {
        setLoading(false);
    }
}, []);

const resetAnalytics = useCallback(() => {
    try {
        setSmsAnalytics({
            total: 0,
            debitCount: 0,
            creditCount: 0,
            otherCount: 0,
            debitAmount: 0,
            creditAmount: 0,
            balance: 0,
            messages: []
        });
        setSpamMessages([]);
        setEcommerceMessages([]);
        setOtpMessages([]);
        AsyncStorage.multiRemove(['@sms_spam', '@sms_ecommerce', '@sms_otp']);
        lastProcessedTime.current = {};
    } catch (err) {
        console.error("[SMSContext] Reset failed:", err);
    }
}, []);

const updateSalary = useCallback(async (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    await updateUserProfile({ salary: num });
}, [updateUserProfile]);

const value = useMemo(() => ({
    smsAnalytics,
    spamMessages,
    ecommerceMessages,
    otpMessages,
    user,
    loading,
    addMessage,
    removeMessage,
    clearCategory,
    triggerManualSync,
    resetAnalytics,
    updateSalary,
    lastNotification,
    isFraudDetectionEnabled,
    setIsFraudDetectionEnabled,
    fraudAlerts,
    setFraudAlerts,
    aiInsights,
    isDataLoaded,
    clearNotification: () => setLastNotification(null),
}), [
    smsAnalytics, spamMessages, ecommerceMessages, otpMessages, 
    user, loading, addMessage, removeMessage, clearCategory,
    triggerManualSync, resetAnalytics, updateSalary, 
    lastNotification, isFraudDetectionEnabled, fraudAlerts, aiInsights, isDataLoaded
]);

    return (
        <SMSAnalyticsContext.Provider value={value}>
            {children}
        </SMSAnalyticsContext.Provider>
    );
};

export const useSMSAnalytics = () => {
    const context = useContext(SMSAnalyticsContext);
    if (!context) {
        throw new Error('useSMSAnalytics must be used within a SMSAnalyticsProvider');
    }
    return context;
};
