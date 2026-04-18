import axios from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5050' : 'http://localhost:5050';

const MERCHANTS = [
    'Amazon India', 'Swiggy', 'Zomato', 'Netflix', 'Uber', 
    'Reliance Digital', 'Starbucks', 'Flipkart', 'BigBasket', 
    'HDFC Credit Card', 'Airtel Bill', 'Jio Recharge'
];

const SOURCES = ['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Paytm'];

const SIMULATED_TEMPLATES = [
    {
        type: 'debit',
        generate: () => {
            const amount = Math.floor(Math.random() * 5000) + 50;
            const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
            const bank = SOURCES[Math.floor(Math.random() * SOURCES.length)];
            const acct = Math.floor(Math.random() * 9000) + 1000;
            return {
                text: `${bank}: Rs ${amount} debited from A/C XXXX${acct} at ${merchant}. Ref No: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                amount,
                merchant
            };
        }
    },
    {
        type: 'credit',
        generate: () => {
            const amount = Math.floor(Math.random() * 20000) + 500;
            const bank = SOURCES[Math.floor(Math.random() * SOURCES.length)];
            const acct = Math.floor(Math.random() * 9000) + 1000;
            return {
                text: `${bank}: Your A/C XXXX${acct} has been credited with Rs ${amount}. Available Bal: Rs ${Math.floor(Math.random() * 100000)}`,
                amount,
                merchant: bank
            };
        }
    },
    {
        type: 'other',
        generate: () => {
            const otp = Math.floor(100000 + Math.random() * 900000);
            return {
                text: `${otp} is your OTP for transaction at Amazon. Do not share this with anyone.`,
                amount: 0,
                merchant: 'Amazon'
            };
        }
    }
];

class SMSBotService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        console.log('[SMSBot] Service Initialized');
    }

    /**
     * Starts the SMS simulation.
     * @param {Function} onNewMessage Callback receiving the analyzed message.
     * @param {number} intervalMs How often to generate a message.
     */
    start(onNewMessage, intervalMs = 5000) {
        if (this.isRunning) {
            console.log('[SMSBot] Service already running');
            return;
        }

        if (typeof onNewMessage !== 'function') {
            console.error('[SMSBot] Invalid callback provided to start()');
            return;
        }
        
        // Safety: Ensure any existing interval is cleared
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        console.log('[SMSBot] Simulation starting with interval:', intervalMs);
        this.isRunning = true;
        
        this.intervalId = setInterval(async () => {
            if (!this.isRunning) return;

            try {
                // 1. Pick a random template
                const templateIndex = Math.floor(Math.random() * SIMULATED_TEMPLATES.length);
                const template = SIMULATED_TEMPLATES[templateIndex];
                
                if (!template || !template.generate) {
                    console.error('[SMSBot] Template error at index:', templateIndex);
                    return;
                }

                const { text } = template.generate();
                console.log('[SMSBot] Generated SMS:', text.substring(0, 30) + '...');

                // 2. Analyze via Flask API
                console.log('[SMSBot] Calling API:', API_BASE_URL);
                const response = await axios.post(`${API_BASE_URL}/analyze-sms`, 
                    { sms: text },
                    { timeout: 4000 } // Short timeout for simulation
                );
                
                // 3. Callback with results
                if (response.data && typeof onNewMessage === 'function') {
                    console.log('[SMSBot] Analysis success, sending to UI');
                    onNewMessage({
                        ...response.data,
                        id: 'SIM_' + Date.now(),
                        original_sms: text, 
                        date: Date.now(),
                    });
                } else {
                    console.warn('[SMSBot] API returned invalid data or callback lost');
                }
            } catch (error) {
                console.error('[SMSBot] Simulation Step Error:', error.message);
                if (error.code === 'ECONNABORTED') {
                    console.warn('[SMSBot] API Timeout - Is the Flask server running on port 5050?');
                }
            }
        }, intervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('[SMSBot] Simulation stopped');
        }
    }
}

export default new SMSBotService();
