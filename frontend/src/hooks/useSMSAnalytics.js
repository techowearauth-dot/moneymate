import { useState, useEffect, useCallback } from 'react';
import SMSService from '../services/SMSService';

const useSMSAnalytics = () => {
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
    const [error, setError] = useState(null);

    const syncSMS = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch SMS from device
            const deviceMessages = await SMSService.fetchDeviceSMS();
            
            if (deviceMessages.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Analyze messages via Flask API
            const analyzed = await SMSService.analyzeMessages(deviceMessages);
            
            // 3. Process and aggregate state
            const finalStats = SMSService.processAnalytics(analyzed);
            
            setSmsAnalytics(finalStats);
        } catch (err) {
            console.error('Sync failed:', err);
            setError('Failed to process SMS insights');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial sync
    useEffect(() => {
        syncSMS();
    }, [syncSMS]);

    return { smsAnalytics, loading, error, refresh: syncSMS };
};

export default useSMSAnalytics;
