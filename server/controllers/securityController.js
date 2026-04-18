const SecurityService = require('../services/SecurityService');
const Alert = require('../models/Alert');
const Device = require('../models/Device');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Handle SMS Analysis request
 */
exports.analyzeSms = async (req, res, next) => {
    try {
        const { text } = req.body;
        const userId = req.user.id;

        if (!text) {
            return res.status(400).json({ success: false, message: 'SMS text is required' });
        }

        const alert = await SecurityService.analyzeSms(userId, text);

        res.status(200).json({
            success: true,
            isFlagged: !!alert,
            alert
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's security score and active alerts
 */
exports.getSecurityStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('securityScore');
        
        const activeAlerts = await Alert.find({ user: userId, status: 'ACTIVE' })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            score: user.securityScore,
            alerts: activeAlerts
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Trigger Emergency Mode
 */
exports.triggerEmergency = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { location, deviceInfo } = req.body;

        // 1. Fetch user data (contacts, etc)
        const user = await User.findById(userId);
        
        // 2. Fetch last transaction
        const lastTxn = await Transaction.findOne({ sender: userId }).sort({ createdAt: -1 });

        // 3. Log the emergency
        await SecurityService.logEvent(userId, 'EMERGENCY_TRIGGERED', 'User activated emergency mode', 'critical', {
            location,
            deviceInfo,
            lastTransaction: lastTxn ? lastTxn.id : 'None'
        });

        // 4. Create a critical alert
        await SecurityService.createAlert(userId, {
            type: 'EMERGENCY_TRIGGERED',
            severity: 'critical',
            title: 'EMERGENCY MODE ACTIVATED',
            message: 'SOS broadcasted to emergency contacts with live location.',
            metadata: { location, lastTxn: lastTxn ? lastTxn.id : null }
        });

        // 5. Update score
        await SecurityService.updateSecurityScore(userId);

        res.status(200).json({
            success: true,
            message: 'Emergency protocols initiated.',
            contactsNotified: user.emergencyContacts.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Manage Trusted Devices
 */
exports.getDevices = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const devices = await Device.find({ user: userId, status: 'ACTIVE' });
        
        res.status(200).json({
            success: true,
            devices
        });
    } catch (error) {
        next(error);
    }
};

exports.removeDevice = async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const userId = req.user.id;

        await Device.findOneAndUpdate(
            { user: userId, deviceId: deviceId },
            { status: 'LOGGED_OUT', isTrusted: false }
        );

        res.status(200).json({
            success: true,
            message: 'Device removed and session invalidated.'
        });
    } catch (error) {
        next(error);
    }
};
