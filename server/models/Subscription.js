const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        serviceName: {
            type: String,
            required: true // e.g., 'Netflix', 'Spotify'
        },
        amount: {
            type: Number,
            required: true
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'yearly'],
            default: 'monthly'
        },
        nextBillingDate: {
            type: Date,
            required: true
        },
        autoPayEnabled: {
            type: Boolean,
            default: true
        },
        maxAutoDebitLimit: {
            type: Number
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
            default: 'ACTIVE'
        },
        lastPaidAt: Date,
        category: {
            type: String,
            default: 'Entertainment'
        }
    },
    { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
