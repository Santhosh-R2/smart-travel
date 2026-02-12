const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for the developer
    console.error(`[Error]: ${err.stack}`.red || err.message);

    // 1. Mongoose Bad ObjectId (Cast Error)
    // Happens when a user sends an ID that doesn't match MongoDB format
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    // 2. Mongoose Duplicate Key (Code 11000)
    // Happens when a user registers with an email that already exists
    if (err.code === 11000) {
        const message = 'Duplicate field value entered (e.g., email already exists)';
        error = new ErrorResponse(message, 400);
    }

    // 3. Mongoose Validation Error
    // Happens when required fields are missing or enums don't match
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    // 4. JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new ErrorResponse('Invalid token. Please log in again.', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new ErrorResponse('Your session has expired. Please log in again.', 401);
    }

    // Final Response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        // Only show stack trace in development mode
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;