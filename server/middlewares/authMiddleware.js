const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return errorResponse(res, 401, 'Not authorized to access this route');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            return errorResponse(res, 401, 'The user belonging to this token no longer exists.');
        }

        req.user = user;
        next();
    } catch (err) {
        // Errors caught by errorMiddleware (TokenExpiredError, JsonWebTokenError)
        next(err);
    }
};
