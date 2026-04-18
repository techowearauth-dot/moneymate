const express = require('express');
const { 
    register, 
    login, 
    logout, 
    forgotPassword, 
    resetPassword, 
    refreshToken, 
    getMe,
    updateProfile
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { 
    apiLimiter, 
    loginLimiter, 
    strictLimiter 
} = require('../middlewares/rateLimiter');
const { 
    registerValidation, 
    loginValidation, 
    forgotPasswordValidation, 
    resetPasswordValidation 
} = require('../validators/authValidators');

const router = express.Router();

// Apply general rate limits to all routes by default
router.use(apiLimiter);

router.post('/register', strictLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', logout);
router.post('/forgot-password', strictLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', strictLimiter, resetPasswordValidation, resetPassword);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

module.exports = router;
