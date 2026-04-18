import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { Platform } from 'react-native';
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
        messages: []
    });

    const [loading, setLoading] = useState(false);
    const [lastNotification, setLastNotification] = useState(null);
    const [isFraudDetectionEnabled, setIsFraudDetectionEnabled] = useState(false);
    const [fraudAlerts, setFraudAlerts] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);
    const lastProcessedTime = useRef({});

    /**
     * Integrates a new analyzed transaction into the global state.
     * Implements "rapid duplicate" prevention (2-second window).
     */
    const addMessage = useCallback(async (analyzedMsg) => {
        if (!analyzedMsg) return;

        try {
            const now = Date.now();
            const msgKey = analyzedMsg.original_sms || analyzedMsg.text || 'unknown';

            // 1. Rapid Duplicate Prevention
            if (lastProcessedTime.current[msgKey] && (now - lastProcessedTime.current[msgKey] < 2000)) {
                return;
            }
            lastProcessedTime.current[msgKey] = now;

            // -- NEW: Contextual Analysis Step --
            // If the message is a debit/credit but lacks an anomaly reason, we refine it
            let refinedMsg = analyzedMsg;
            if (analyzedMsg.type !== 'other' && !analyzedMsg.anomalyReason) {
                const history = smsAnalytics.messages || [];
                const contextResult = await SMSService.analyzeContextual(
                    analyzedMsg.original_sms || analyzedMsg.text,
                    history
                );
                if (contextResult) {
                    refinedMsg = { ...analyzedMsg, ...contextResult };
                }
            }

            // 2. Real-time Backend Fraud Analysis (if enabled)
            if (isFraudDetectionEnabled) {
                securityService.analyzeSms(refinedMsg.original_sms || refinedMsg.text)
                    .catch(e => console.error('[SMSContext] Backend analysis failed:', e));
            }

            const { generateTxId } = require('../utils/txUtils');
            const msgWithDate = {
                ...refinedMsg,
                category: refinedMsg.category || SMSService.detectCategory(refinedMsg.original_sms || refinedMsg.text),
                merchant: refinedMsg.merchant || 'Unknown Merchant',
                date: refinedMsg.date || now,
                isAuto: true,
                timestamp: refinedMsg.timestamp || now
            };

            const txId = generateTxId(msgWithDate);
            msgWithDate.id = txId; // Ensure stable ID

            setSmsAnalytics(prev => {
                const safePrev = prev || { total: 0, messages: [] };
                
                // 1. Content-Based Deduplication (ROBUST)
                const exists = safePrev.messages.some(m => generateTxId(m) === txId);
                if (exists) {
                    console.log("[SMSContext] Duplicate transaction detected by ID, skipping:", txId);
                    return prev;
                }

                const updatedMessages = [msgWithDate, ...(safePrev.messages || [])];

                // 2. RECALCULATE ANALYTICS IN REAL-TIME
                const updatedStats = SMSService.processAnalytics(updatedMessages);

                // Fraud detection logic remains...
                let finalRiskLevel = msgWithDate.riskLevel || 'LOW';
                if (finalRiskLevel !== 'LOW') {
                    setFraudAlerts(prevAlerts => [{
                        id: 'ALERT_' + txId,
                        txnId: txId,
                        merchant: msgWithDate.merchant,
                        amount: msgWithDate.amount,
                        riskLevel: finalRiskLevel,
                        timestamp: now,
                        message: msgWithDate.anomalyReason || `${finalRiskLevel} Risk detected`
                    }, ...prevAlerts].slice(0, 20));
                }

                return updatedStats;
            });

            // Trigger notification
            setLastNotification({ ...refinedMsg, timestamp: now });

            setTimeout(() => {
                setLastNotification(prev => (prev?.timestamp === now ? null : prev));
            }, 3500);
        } catch (err) {
            console.error("[SMSContext] Error in addMessage:", err);
        }
    }, [smsAnalytics, setSmsAnalytics]);

/**
 * Manually sync real SMS from the device.
 */
const triggerManualSync = useCallback(async () => {
    setLoading(true);
    console.log("[SMSContext] Manual sync triggered");
    try {
        const deviceMessages = await SMSService.fetchDeviceSMS();
        if (deviceMessages && deviceMessages.length > 0) {
            console.log("[SMSContext] Fetched", deviceMessages.length, "messages");
            const analyzed = await SMSService.analyzeMessages(deviceMessages);
            const finalStats = SMSService.processAnalytics(analyzed);
            setSmsAnalytics(finalStats);
        } else {
            console.log("[SMSContext] No messages found on device");
        }
    } catch (err) {
        console.error('[SMSContext] Manual sync failed:', err);
    } finally {
        setLoading(false);
    }
}, []);

/**
 * Resets the entire analytics state to zero.
 */
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
        lastProcessedTime.current = {};
        console.log('[SMSContext] Analytics reset');
    } catch (err) {
        console.error("[SMSContext] Reset failed:", err);
    }
}, []);

/**
 * Updates user salary via AuthContext
 */
const updateSalary = useCallback(async (val) => {
    console.log("[SMSContext] updateSalary called with:", val);
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
        console.log("[SMSContext] Invalid salary value, skipping update");
        return;
    }
    await updateUserProfile({ salary: num });
}, [updateUserProfile]);

const value = useMemo(() => ({
    smsAnalytics,
    user,
    loading,
    addMessage,
    triggerManualSync,
    resetAnalytics,
    updateSalary,
    lastNotification,
    isFraudDetectionEnabled,
    setIsFraudDetectionEnabled,
    fraudAlerts,
    setFraudAlerts,
    aiInsights,
    clearNotification: () => setLastNotification(null),
}), [smsAnalytics, user, loading, addMessage, triggerManualSync, resetAnalytics, updateSalary, lastNotification, isFraudDetectionEnabled, fraudAlerts, aiInsights]);

console.log("[SMSContext] Providing state");

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
