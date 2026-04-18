const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { sendResetPasswordEmail } = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        let { name, email, password } = req.body;
        
        if (email) email = email.toLowerCase();

        // Check if email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return errorResponse(res, 409, 'Email already registered', [{ field: 'email', message: 'The email is already in use' }]);
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token to DB (First session)
        user.refreshTokens = [refreshToken];
        await user.save({ validateBeforeSave: false });

        successResponse(res, 201, 'User registered successfully', {
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, salary: user.salary }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        let { email, password } = req.body;
        console.log('[DEBUG] Login Request Body:', { email, passwordLength: password?.length });

        if (email) email = email.toLowerCase();

        // Find user by email and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        console.log('[DEBUG] User found in DB:', user ? `Yes, ID: ${user._id}` : 'No');
        
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        console.log('[DEBUG] Password comparison result:', isMatch);
        
        if (!isMatch) {
            return errorResponse(res, 401, 'Invalid password');
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Add new refresh token to array (Support Multi-Device)
        if (!user.refreshTokens) user.refreshTokens = [];
        
        // Limit to 5 active sessions to prevent array bloat
        if (user.refreshTokens.length >= 5) {
            user.refreshTokens.shift(); // Remove oldest session
        }
        
        user.refreshTokens.push(refreshToken);
        await user.save({ validateBeforeSave: false });

        successResponse(res, 200, 'Logged in successfully', {
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, salary: user.salary }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            // Remove the specific session token from the user's array
            await User.findOneAndUpdate(
                { refreshTokens: refreshToken },
                { $pull: { refreshTokens: refreshToken } }
            );
        }

        successResponse(res, 200, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Return success even if not found to prevent email enumeration
            return successResponse(res, 200, 'If this email exists, a reset link has been sent');
        }

        // Generate reset token
        const resetToken = user.generateResetToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        // Example deep link format: vaultify://reset-password?token=XYZ
        // Example web format: http://localhost:3000/reset-password?token=XYZ
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        try {
            await sendResetPasswordEmail(user, resetUrl);
            successResponse(res, 200, 'If this email exists, a reset link has been sent');
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            
            console.error('Email send error:', error);
            return errorResponse(res, 500, 'Email could not be sent');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // Find user by matched token & check expiry
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return errorResponse(res, 400, 'Invalid or expired reset token');
        }

        // Set new password
        user.password = req.body.password;
        
        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save(); // validation runs here, pre-save hook hashes password

        // Log user in automatically with new tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        // Add to sessions
        if (!user.refreshTokens) user.refreshTokens = [];
        user.refreshTokens.push(refreshToken);
        await user.save({ validateBeforeSave: false });

        successResponse(res, 200, 'Password reset successfully', {
            accessToken,
            user: { id: user._id, name: user.name, email: user.email, salary: user.salary }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        console.log('[DEBUG] Token Refresh request received', { hasToken: !!refreshToken });

        if (!refreshToken) {
            console.log('[DEBUG] Token Refresh failed: No token provided');
            return errorResponse(res, 401, 'No refresh token provided');
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            console.log('[DEBUG] Token Refresh failed: Invalid signature or expired', err.message);
            return errorResponse(res, 401, 'Invalid or expired refresh token');
        }

        // Find user and check if the provided token exists in their active sessions
        const user = await User.findById(decoded.id);
        if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
            console.log('[DEBUG] Token Refresh failed: User not found or session not in DB');
            return errorResponse(res, 401, 'Invalid refresh token');
        }

        // Issue new tokens (TOKEN ROTATION for enhanced security)
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        // Replace the old token with the new rotated one
        user.refreshTokens = user.refreshTokens.map(t => t === refreshToken ? newRefreshToken : t);
        await user.save({ validateBeforeSave: false });

        successResponse(res, 200, 'Token refreshed successfully', {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Current User
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        // req.user is populated by protect middleware
        successResponse(res, 200, 'User data retrieved', {
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                isVerified: req.user.isVerified,
                salary: req.user.salary,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Update User Profile
// @route   PATCH /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, salary } = req.body;
        
        const user = await User.findById(req.user._id);

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        if (name) user.name = name;
        if (salary !== undefined) user.salary = salary;

        await user.save();

        successResponse(res, 200, 'Profile updated successfully', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                salary: user.salary
            }
        });
    } catch (error) {
        next(error);
    }
};
