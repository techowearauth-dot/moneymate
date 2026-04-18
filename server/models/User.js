const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [50, 'Name cannot exceed 50 characters']
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            select: false // never returned in queries by default
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        refreshTokens: [String],
        balance: {
            type: Number,
            default: 10000 // Starting balance for demo
        },
        upiId: {
            type: String,
            unique: true,
            sparse: true 
        },
        salary: {
            type: Number,
            default: null,
            min: 0
        },
        // --- Security Settings ---
        securityScore: {
            type: Number,
            default: 100
        },
        smsFraudDetectionEnabled: {
            type: Boolean,
            default: true
        },
        suspiciousActivityAlertsEnabled: {
            type: Boolean,
            default: true
        },
        autoMonitoringEnabled: {
            type: Boolean,
            default: false
        },
        voiceAlertEnabled: {
            type: Boolean,
            default: false
        },
        locationSharingEnabled: {
            type: Boolean,
            default: true
        },
        appLockEnabled: {
            type: Boolean,
            default: false
        },
        twoFAEnabled: {
            type: Boolean,
            default: false
        },
        biometricsEnabled: {
            type: Boolean,
            default: false
        },
        emergencyContacts: [
            {
                name: String,
                phone: String,
                email: String
            }
        ],
        trustedDevices: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Device'
            }
        ],
        // --- Payment Settings ---
        dailySpendingLimit: {
            type: Number,
            default: 50000
        },
        perTransactionLimit: {
            type: Number,
            default: 10000
        },
        categoryLimits: {
            type: Map,
            of: Number,
            default: {
                Food: 5000,
                Shopping: 10000,
                Travel: 5000,
                Entertainment: 2000
            }
        },
        requirePinForPayment: {
            type: Boolean,
            default: true
        },
        biometricAuthEnabled: {
            type: Boolean,
            default: false
        },
        autoBlockUnknownMerchants: {
            type: Boolean,
            default: false
        },
        upiPaymentsEnabled: {
            type: Boolean,
            default: true
        },
        upiDailyLimit: {
            type: Number,
            default: 25000
        }
    },
    { timestamps: true }
);

// Pre-save hook to hash password if modified
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to generate reset token
userSchema.methods.generateResetToken = function() {
    // Generate raw token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    // Set expire time to 10 minutes
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
