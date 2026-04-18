const { errorResponse } = require('../utils/apiResponse');

exports.errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;

    // Log to console for dev
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found or invalid ID format';
        return errorResponse(res, 400, message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        // Find which field is duplicated
        const field = Object.keys(err.keyValue)[0];
        const message = field === 'email' ? 'Email already registered' : 'Duplicate field value entered';
        const errors = [{ field, message: `The ${field} is already in use` }];
        return errorResponse(res, 409, message, errors);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = 'Validation Error';
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
        return errorResponse(res, 400, message, errors);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return errorResponse(res, 401, 'Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token expired');
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 && process.env.NODE_ENV !== 'development' 
        ? 'Internal Server Error' 
        : error.message || 'Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        errors: []
    });
};
