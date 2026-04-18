const { body, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

// Validation middleware executor
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        return errorResponse(res, 400, 'Validation failed', formattedErrors);
    }
    next();
};

exports.registerValidation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .trim()
        .matches(/^[A-Za-z\s]+$/).withMessage('Name can only contain letters and spaces'),
        
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least 1 lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least 1 number')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain at least 1 special character (!@#$%^&*)'),

    validate
];

exports.loginValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validate
];

exports.forgotPasswordValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
        
    validate
];

exports.resetPasswordValidation = [
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least 1 uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least 1 lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least 1 number')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain at least 1 special character (!@#$%^&*)'),

    validate
];
