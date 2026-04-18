const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        event: {
            type: String,
            required: true // e.g., 'SUSPICIOUS_SMS_DETECTED', 'SCORE_UPDATED', 'TRUSTED_DEVICE_ADDED'
        },
        description: String,
        severity: {
            type: String,
            enum: ['info', 'low', 'medium', 'high', 'critical'],
            default: 'info'
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ipAddress: String,
        deviceId: String
    },
    { timestamps: true }
);

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
module.exports = SecurityLog;
