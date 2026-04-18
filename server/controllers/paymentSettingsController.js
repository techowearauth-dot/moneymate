const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const Beneficiary = require('../models/Beneficiary');
const Subscription = require('../models/Subscription');

/**
 * Manage Payment Methods
 */
exports.getMethods = async (req, res, next) => {
    try {
        const methods = await PaymentMethod.find({ user: req.user.id });
        res.status(200).json({ success: true, methods });
    } catch (error) { next(error); }
};

exports.addMethod = async (req, res, next) => {
    try {
        const { type, provider, identifier, isDefault } = req.body;
        
        if (isDefault) {
            await PaymentMethod.updateMany({ user: req.user.id }, { isDefault: false });
        }

        const method = await PaymentMethod.create({
            user: req.user.id,
            type,
            provider,
            identifier,
            isDefault: isDefault || false
        });

        res.status(201).json({ success: true, method });
    } catch (error) { next(error); }
};

exports.setDefaultMethod = async (req, res, next) => {
    try {
        const { methodId } = req.params;
        await PaymentMethod.updateMany({ user: req.user.id }, { isDefault: false });
        await PaymentMethod.findByIdAndUpdate(methodId, { isDefault: true });
        res.status(200).json({ success: true, message: 'Default payment method updated' });
    } catch (error) { next(error); }
};

/**
 * Manage Limits
 */
exports.updateLimits = async (req, res, next) => {
    try {
        const { dailyLimit, perTxnLimit, upiLimit, categoryLimits } = req.body;
        const updates = {};
        
        if (dailyLimit !== undefined) updates.dailySpendingLimit = dailyLimit;
        if (perTxnLimit !== undefined) updates.perTransactionLimit = perTxnLimit;
        if (upiLimit !== undefined) updates.upiDailyLimit = upiLimit;
        if (categoryLimits) updates.categoryLimits = categoryLimits;

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
        res.status(200).json({ success: true, user });
    } catch (error) { next(error); }
};

/**
 * Manage Beneficiaries
 */
exports.getBeneficiaries = async (req, res, next) => {
    try {
        const beneficiaries = await Beneficiary.find({ user: req.user.id });
        res.status(200).json({ success: true, beneficiaries });
    } catch (error) { next(error); }
};

exports.addBeneficiary = async (req, res, next) => {
    try {
        const beneficiary = await Beneficiary.create({
            user: req.user.id,
            ...req.body
        });
        res.status(201).json({ success: true, beneficiary });
    } catch (error) { next(error); }
};

exports.toggleBeneficiaryTrust = async (req, res, next) => {
    try {
        const { id } = req.params;
        const beneficiary = await Beneficiary.findById(id);
        if (!beneficiary) return res.status(404).json({ success: false, message: 'Not found' });

        beneficiary.isTrusted = !beneficiary.isTrusted;
        await beneficiary.save();
        res.status(200).json({ success: true, beneficiary });
    } catch (error) { next(error); }
};

/**
 * Manage Subscriptions
 */
exports.getSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user.id });
        res.status(200).json({ success: true, subscriptions });
    } catch (error) { next(error); }
};

exports.toggleAutopay = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sub = await Subscription.findById(id);
        if (!sub) return res.status(404).json({ success: false, message: 'Not found' });

        sub.autoPayEnabled = !sub.autoPayEnabled;
        await sub.save();
        res.status(200).json({ success: true, subscription: sub });
    } catch (error) { next(error); }
};
