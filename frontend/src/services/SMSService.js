import axios from 'axios';
import { Platform } from 'react-native';

// Standard Android emulator IP for localhost access
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

class SMSService {
    /**
     * Fetches SMS from the device using react-native-get-sms-android.
     * Note: Requires Development Build (not compatible with Expo Go).
     */
    async fetchDeviceSMS() {
        if (Platform.OS !== 'android') {
            console.warn('SMS fetching is only supported on Android.');
            return [];
        }

        try {
            // We use require for the native module to avoid crash in Expo Go if not installed
            const SmsAndroid = require('react-native-get-sms-android').default;

            const filter = {
                box: 'inbox',
                maxCount: 100, // Process last 100 SMS
            };

            return new Promise((resolve, reject) => {
                SmsAndroid.list(
                    JSON.stringify(filter),
                    (fail) => reject(fail),
                    (count, smsList) => {
                        const parsedList = JSON.parse(smsList);
                        resolve(parsedList);
                    }
                );
            });
        } catch (error) {
            console.error('Failed to access react-native-get-sms-android:', error);
            return [];
        }
    }

    /**
     * High-level classification for SMS filtering logic.
     */
    classifySMS(text) {
        if (!text) return 'spam';
        const body = text.toLowerCase();
        
        // 1. Financial (Transactions & Bank Alerts)
        if (body.includes('credited') || body.includes('debited') || body.includes('txn') || body.includes('upi') || body.includes('a/c') || body.includes('bank') || body.includes('available balance')) {
            return 'financial';
        }
        
        // 2. OTP / Security
        if (body.includes('otp') || body.includes('verification code') || body.includes('secret code') || body.includes('login code') || body.includes('one-time password')) {
            return 'otp';
        }

        // 3. E-commerce / Delivery
        if (body.includes('order') || body.includes('delivered') || body.includes('shipped') || body.includes('tracking') || body.includes('out for delivery') || body.includes('package')) {
            return 'ecommerce';
        }

        // 4. Everything else is Spam/Promotional
        return 'spam';
    }

    /**
     * Categorizes a transaction based on keywords in the SMS body.
     */
    detectCategory(text) {
        if (!text) return 'other';
        const body = text.toLowerCase();

        // 1. Food & Dining
        if (body.includes('swiggy') || body.includes('zomato') || body.includes('restaurant') ||
            body.includes('cafe') || body.includes('eat') || body.includes('dining')) {
            return 'food';
        }

        // 2. Travel & Transport
        if (body.includes('uber') || body.includes('ola') || body.includes('rapido') ||
            body.includes('irctc') || body.includes('metro') || body.includes('ubergate') ||
            body.includes('fuel') || body.includes('petrol') || body.includes('shell')) {
            return 'travel';
        }

        // 3. Shopping
        if (body.includes('amazon') || body.includes('flipkart') || body.includes('myntra') ||
            body.includes('nykaa') || body.includes('ajio') || body.includes('shopping')) {
            return 'shopping';
        }

        // 4. Bills & Utilities
        if (body.includes('electricity') || body.includes('airtel') || body.includes('jio') ||
            body.includes('recharge') || body.includes('bill') || body.includes('water') ||
            body.includes('broadband') || body.includes('bsnl') || body.includes('vi ')) {
            return 'bills';
        }

        // 5. Entertainment
        if (body.includes('netflix') || body.includes('hotstar') || body.includes('spotify') ||
            body.includes('cinema') || body.includes('pvr') || body.includes('inox') ||
            body.includes('prime video')) {
            return 'entertainment';
        }

        return 'other';
    }

    /**
     * Sends a batch of SMS messages to the Flask API for analysis.
     */
    async analyzeMessages(messages) {
        if (messages.length === 0) return [];

        try {
            const response = await axios.post(`${BASE_URL}/analyze-batch`, {
                messages: messages.map(m => m.body)
            }, { timeout: 15000 });

            const results = response.data.results.map((data, index) => ({
                id: messages[index]._id || Math.random().toString(),
                text: messages[index].body,
                date: messages[index].date || new Date().getTime(),
                category: data.category || this.detectCategory(messages[index].body),
                merchant: data.merchant || 'Unknown Merchant',
                isAuto: true,
                ...data
            }));

            return results;
        } catch (error) {
            console.error('Batch analysis failed:', error);
            return messages.map(msg => ({
                id: msg._id || Math.random().toString(),
                text: msg.body,
                date: msg.date || new Date().getTime(),
                category: this.detectCategory(msg.body),
                type: 'other',
                amount: 0,
                merchant: 'Unknown Merchant',
                isAuto: true
            }));
        }
    }

    /**
     * Contextual Analysis: Sends SMS + recent history for smarter anomaly detection
     */
    async analyzeContextual(smsText, history = []) {
        try {
            // Take the last 20 debits for context
            const historyContext = history
                .filter(h => h.type === 'debit')
                .slice(0, 20)
                .map(h => ({ amount: h.amount, type: h.type, merchant: h.merchant }));

            const response = await axios.post(`${BASE_URL}/analyze-contextual`, {
                sms: smsText,
                history: historyContext
            }, { timeout: 10000 });

            return {
                ...response.data,
                category: response.data.category || this.detectCategory(smsText)
            };
        } catch (error) {
            console.error('Contextual analysis failed:', error);
            return null;
        }
    }

    /**
     * Aggregates analyzed messages into a unified analytics state.
     */
    processAnalytics(analyzedMessages) {
        const stats = {
            total: analyzedMessages.length,
            debitCount: 0,
            creditCount: 0,
            otherCount: 0,
            debitAmount: 0,
            creditAmount: 0,
            balance: 0,
            messages: analyzedMessages
        };

        analyzedMessages.forEach(msg => {
            if (msg.type === 'debit') {
                stats.debitCount++;
                stats.debitAmount += msg.amount;
            } else if (msg.type === 'credit') {
                stats.creditCount++;
                stats.creditAmount += msg.amount;
            } else {
                stats.otherCount++;
            }
        });

        stats.balance = stats.creditAmount - stats.debitAmount;
        return stats;
    }
}

export default new SMSService();
