const ErrorResponse = require('../utils/errorResponse');

/**
 * Global error handling middleware.
 * Catches ErrorResponse instances and Mongoose errors, returns JSON.
 */
const errorHandler = (err, req, res, _next) => {
    let error = { ...err };
    error.message = err.message;

    // Log for dev
    console.error('ERROR:', err.message);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = new ErrorResponse('Resource not found', 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        error = new ErrorResponse('Duplicate field value entered', 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
    });
};

module.exports = errorHandler;
