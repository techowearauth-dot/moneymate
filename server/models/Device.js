const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        deviceId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            default: 'Unknown Device'
        },
        type: {
            type: String,
            enum: ['mobile', 'tablet', 'desktop', 'browser'],
            default: 'mobile'
        },
        ipAddress: String,
        location: {
            city: String,
            country: String,
            coordinates: [Number] // [lng, lat]
        },
        isTrusted: {
            type: Boolean,
            default: false
        },
        lastActive: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'BLOCKED', 'LOGGED_OUT'],
            default: 'ACTIVE'
        }
    },
    { timestamps: true }
);

// Composite unique index
deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;
