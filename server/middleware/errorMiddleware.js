const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error(`[Error]: ${err.stack}`.red || err.message);

    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    if (err.code === 11000) {
        const message = 'Duplicate field value entered (e.g., email already exists)';
        error = new ErrorResponse(message, 400);
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    if (err.name === 'JsonWebTokenError') {
        error = new ErrorResponse('Invalid token. Please log in again.', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new ErrorResponse('Your session has expired. Please log in again.', 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;