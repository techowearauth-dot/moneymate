const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please provide a receiver']
        },
        amount: {
            type: Number,
            required: [true, 'Please provide an amount'],
            min: [1, 'Amount must be at least 1']
        },
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        paymentId: {
            type: String
        },
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED'],
            default: 'PENDING'
        },
        type: {
            type: String,
            enum: ['SENT', 'RECEIVED', 'credit', 'debit'],
            required: true
        },
        source: {
            type: String,
            enum: ['sms', 'manual', 'upi', 'system'],
            default: 'upi'
        },
        note: {
            type: String,
            maxlength: [100, 'Note cannot exceed 100 characters']
        },
        upiId: {
            type: String
        },
        method: {
            type: String,
            enum: ['UPI', 'CARD', 'BANK'],
            default: 'UPI'
        },
        recipientName: {
            type: String
        },
        category: {
            type: String,
            default: 'other'
        }
    },
    { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
