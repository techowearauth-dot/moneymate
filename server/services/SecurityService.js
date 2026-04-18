const Alert = require('../models/Alert');
const SecurityLog = require('../models/SecurityLog');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getIO } = require('./socketService');

class SecurityService {
    /**
     * Analyzes SMS for fraudulent patterns
     */
    async analyzeSms(userId, smsText) {
        const user = await User.findById(userId);
        if (!user || !user.smsFraudDetectionEnabled) return null;

        const body = smsText.toLowerCase();
        let riskLevel = 'low';
        let reason = '';

        // 1. High Risk Keywords
        const criticalKeywords = ['otp', 'cvv', 'password', 'pin', 'blocked', 'urgent', 'verify', 'action required', 'suspicious'];
        if (criticalKeywords.some(kw => body.includes(kw))) {
            riskLevel = 'high';
            reason = 'SMS contains sensitive keywords (OTP/Urgent)';
        }

        // 2. Look for suspicious links (Simulation)
        if (body.includes('http://') || body.includes('bit.ly') || body.includes('t.co')) {
            riskLevel = 'medium';
            reason = 'SMS contains suspicious links';
        }

        if (riskLevel !== 'low') {
            const alert = await this.createAlert(userId, {
                type: 'FRAUD_SUSPECTED',
                severity: riskLevel,
                title: 'Suspicious SMS Detected',
                message: reason,
                metadata: { sms: smsText }
            });
            
            await this.logEvent(userId, 'SUSPICIOUS_SMS_DETECTED', reason, riskLevel, { sms: smsText });
            await this.updateSecurityScore(userId);
            
            return alert;
        }

        return null;
    }

    /**
     * Analyzes a transaction for behavioral anomalies
     */
    async analyzeTransaction(userId, transactionId) {
        const user = await User.findById(userId);
        if (!user || !user.autoMonitoringEnabled) return;

        const txn = await Transaction.findById(transactionId);
        if (!txn || txn.type !== 'SENT') return;

        // 1. Get average spend for user
        const lastTxns = await Transaction.find({ sender: userId, status: 'SUCCESS' }).limit(10);
        const avg = lastTxns.length > 0 
            ? lastTxns.reduce((acc, t) => acc + t.amount, 0) / lastTxns.length 
            : 0;

        let isAnomaly = false;
        let reason = '';

        // Anomaly: 2x average spend
        if (avg > 0 && txn.amount > avg * 2) {
            isAnomaly = true;
            reason = `Transaction amount (₹${txn.amount}) is significantly higher than your average (₹${avg.toFixed(0)})`;
        }

        // Anomaly: Unusual time (1 AM - 5 AM)
        const hour = new Date().getHours();
        if (hour >= 1 && hour <= 5) {
            isAnomaly = true;
            reason = 'Transaction initiated at an unusual time (late night)';
        }

        if (isAnomaly) {
            await this.createAlert(userId, {
                type: 'ANOMALY_DETECTED',
                severity: 'medium',
                title: 'Unusual Transaction Detected',
                message: reason,
                metadata: { txnId: transactionId, amount: txn.amount }
            });
            
            await this.logEvent(userId, 'ANOMALY_DETECTED', reason, 'medium', { txnId: transactionId });
            await this.updateSecurityScore(userId);
        }
    }

    /**
     * Calculates and updates the user's security score
     */
    async updateSecurityScore(userId) {
        const activeAlerts = await Alert.countDocuments({ user: userId, status: 'ACTIVE' });
        const highRiskLogs = await SecurityLog.countDocuments({ user: userId, severity: { $in: ['high', 'critical'] } });
        
        // Base score = 100
        // Deductions: 10 per active alert, 5 per high-risk log
        let score = 100 - (activeAlerts * 10) - (highRiskLogs * 5);
        score = Math.max(0, Math.min(100, score));

        await User.findByIdAndUpdate(userId, { securityScore: score });
        
        const io = getIO();
        io.to(userId.toString()).emit('score_updated', { score });
        
        return score;
    }

    /**
     * Unified method to create alert and notify client
     */
    async createAlert(userId, alertData) {
        const alert = await Alert.create({
            user: userId,
            ...alertData
        });

        const io = getIO();
        // Emit to the specific user's room
        io.emit('new_security_alert', alert); // Emitting globally for demo, would be to(userId) in production
        
        return alert;
    }

    /**
     * Logs a security event
     */
    async logEvent(userId, event, description, severity = 'info', metadata = {}) {
        return await SecurityLog.create({
            user: userId,
            event,
            description,
            severity,
            metadata
        });
    }
}

module.exports = new SecurityService();
