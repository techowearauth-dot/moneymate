import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { useSMSAnalytics } from './SMSAnalyticsContext';

export const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const { smsAnalytics } = useSMSAnalytics();
    const [backendTransactions, setBackendTransactions] = useState([]);
    const [stockInvestments, setStockInvestments] = useState([]);
    
    const [isLoaded, setIsLoaded] = useState(false);

    const refreshTransactions = useCallback(async () => {
        try {
            const { paymentService } = require('../services/paymentService');
            const response = await paymentService.getTransactions();
            if (response.success) {
                setBackendTransactions(response.transactions);
            }
        } catch (e) {
            console.error("[FinanceContext] Refresh error:", e);
        }
    }, []);

    // Initial load from storage
    useEffect(() => {
        const loadFinanceData = async () => {
            try {
                const [savedInvestments] = await Promise.all([
                    AsyncStorage.getItem('@finance_investments')
                ]);
                
                if (savedInvestments !== null) setStockInvestments(JSON.parse(savedInvestments));
                await refreshTransactions();
            } catch (e) {
                console.error("[FinanceContext] Load error:", e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadFinanceData();
    }, [refreshTransactions]);

    // Persistence on changes
    useEffect(() => {
        if (!isLoaded) return;
        AsyncStorage.setItem('@finance_investments', JSON.stringify(stockInvestments));
    }, [stockInvestments, isLoaded]);

    /**
     * The Master Ledger (Combined & Deduplicated)
     */
    const transactions = useMemo(() => {
        const { deduplicateTransactions } = require('../utils/txUtils');
        
        // Combine SMS and Backend transactions
        const smsTx = smsAnalytics?.messages || [];
        const combined = [...backendTransactions, ...smsTx];
        
        return deduplicateTransactions(combined);
    }, [backendTransactions, smsAnalytics?.messages]);

    /**
     * Unified Financial Analytics (Calculated from Master Ledger)
     */
    const { totalReceived, totalSpent, netBalance } = useMemo(() => {
        const userId = user?.id;

        const received = transactions
            .filter(t => t.type === 'credit' || t.type === 'RECEIVED')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const spent = transactions
            .filter(t => t.type === 'debit' || t.type === 'SENT')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const balance = received - spent;

        // MANDATORY DEBUG LOGS
        console.log("Fetched Transactions:", transactions);
        console.log("Balance:", balance);
        
        // Optional Audit for total clarity
        console.log("-> Calculated Received:", received);
        console.log("-> Calculated Spent:", spent);

        return {
            totalReceived: received,
            totalSpent: spent,
            netBalance: balance
        };
    }, [transactions, user?.id, user?.salary]);

    const addManualTransaction = useCallback(async (txData) => {
        const { paymentService } = require('../services/paymentService');
        
        // 1. Optimistic Update (Instant UI feedback)
        const optimisticTx = {
            id: 'TEMP_' + Date.now(),
            amount: Number(txData.amount || 0),
            type: txData.type === 'income' || txData.type === 'credit' ? 'credit' : 'debit',
            note: txData.note || 'Manual Entry',
            source: txData.source || 'manual',
            date: 'Just Now',
            timestamp: Date.now(),
            status: 'SUCCESS',
            ...txData
        };
        setBackendTransactions(prev => [optimisticTx, ...prev]);

        // 2. Persistent Save to DB
        try {
            const res = await paymentService.addTransaction(txData);
            if (res.success) {
                console.log("Saved Transaction:", res.transaction);
            }
        } catch (e) {
            console.error("[FinanceContext] Save failed:", e);
        }

        // 3. Final Sync
        await refreshTransactions();
    }, [refreshTransactions]);

    const updateInvestments = useCallback((updatedInvestments) => {
        setStockInvestments(updatedInvestments);
    }, []);

    const value = useMemo(() => ({
        netBalance,
        totalReceived,
        totalSpent,
        transactions,
        stockInvestments,
        addManualTransaction,
        refreshTransactions,
        updateInvestments,
        isLoaded
    }), [netBalance, totalReceived, totalSpent, transactions, stockInvestments, addManualTransaction, refreshTransactions, updateInvestments, isLoaded]);

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};
