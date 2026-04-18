const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['UPI', 'CARD', 'BANK'],
            required: true
        },
        provider: {
            type: String, // e.g., 'Google Pay', 'HDFC Bank', 'Visa'
            required: true
        },
        identifier: {
            type: String, // UPI ID or Masked Card Number
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'EXPIRED', 'INACTIVE'],
            default: 'ACTIVE'
        }
    },
    { timestamps: true }
);

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
module.exports = PaymentMethod;
