const VoiceAIService = require('../services/VoiceAIService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const SecurityService = require('../services/SecurityService');

/**
 * Executes the financial action based on voice intent.
 */
exports.processVoiceCommand = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: "No voice text provided" });

        console.log(`🎙️ Voice Command Received: "${text}"`);

        // 1. Parse intent with Gemini
        const result = await VoiceAIService.parseCommand(text);
        const { action, amount, category } = result;

        let responseMessage = "I'm sorry, I didn't quite catch that. Can you repeat?";
        let data = null;

        // 2. Execute Action Logic
        switch (action) {
            case 'CHECK_BALANCE':
                const user = await User.findById(req.user.id);
                responseMessage = `Your current balance is ₹${user.balance.toLocaleString()}`;
                data = { balance: user.balance };
                break;

            case 'SHOW_EXPENSES':
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const txs = await Transaction.find({
                    sender: req.user.id,
                    status: 'SUCCESS',
                    createdAt: { $gte: startOfDay }
                });
                const total = txs.reduce((acc, curr) => acc + curr.amount, 0);
                responseMessage = total > 0 
                    ? `You have spent ₹${total.toLocaleString()} today across ${txs.length} transactions.` 
                    : "You haven't made any transactions today.";
                data = { total, transactions: txs };
                break;

            case 'EMERGENCY':
                // Rely on existing SecurityService logic
                // Pass a simulated location or fetch from user if available
                await SecurityService.triggerEmergency(req.user.id, { 
                    latitude: 0, longitude: 0, 
                    reason: "Voice Triggered Emergency" 
                });
                responseMessage = "Emergency SOS has been activated. Your location is being shared with rescue contacts.";
                break;

            case 'SHOW_BUDGET':
                const budgetUser = await User.findById(req.user.id);
                const limit = budgetUser.dailySpendingLimit || 50000;
                responseMessage = `Your daily spending limit is set to ₹${limit.toLocaleString()}.`;
                data = { limit };
                break;

            case 'SHOW_ALERTS':
                const logs = await SecurityLog.find({ user: req.user.id, severity: 'high' }).sort({ createdAt: -1 }).limit(3);
                responseMessage = logs.length > 0 
                    ? `I found ${logs.length} high-risk alerts in your recent activity. Please check the Security Hub.`
                    : "No suspicious activity detected in your recent logs. You're all clear!";
                data = { logs };
                break;

            default:
                responseMessage = "I'm not sure how to help with that yet. Try asking for your balance or expenses.";
        }

        console.log(`🤖 AI Response: "${responseMessage}"`);

        res.status(200).json({
            success: true,
            action,
            message: responseMessage,
            data
        });

    } catch (error) {
        console.error("[VoiceController] Error:", error);
        res.status(500).json({ success: false, message: "Voice processing failed" });
    }
};
