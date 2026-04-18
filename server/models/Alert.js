const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['FRAUD_SUSPECTED', 'ANOMALY_DETECTED', 'NEW_DEVICE', 'FAILED_LOGIN', 'SECURITY_UPDATE', 'EMERGENCY_TRIGGERED'],
            required: true
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'RESOLVED', 'DISMISSED'],
            default: 'ACTIVE'
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
