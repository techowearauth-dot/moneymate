/**
 * Format success response
 */
exports.successResponse = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Format error response (Typically handled by centralized error middleware, 
 * but good to have a utility for structural consistency if needed)
 */
exports.errorResponse = (res, statusCode, message, errors = []) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors
    });
};
