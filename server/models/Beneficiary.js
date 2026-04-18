const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        upiId: {
            type: String,
            required: true
        },
        phone: String,
        isTrusted: {
            type: Boolean,
            default: false
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        lastTransactionAt: Date,
        category: {
            type: String,
            default: 'General'
        }
    },
    { timestamps: true }
);

// Unique beneficiary per user based on upiId
beneficiarySchema.index({ user: 1, upiId: 1 }, { unique: true });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
module.exports = Beneficiary;
