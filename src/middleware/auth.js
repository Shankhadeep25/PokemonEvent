const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Middleware: verify JWT from Authorization header.
 * Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new ErrorResponse('Not authorized — no token', 401));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user (without password)
        req.user = await User.findById(decoded.id);
        if (!req.user) {
            return next(new ErrorResponse('User no longer exists', 401));
        }

        next();
    } catch (error) {
        return next(new ErrorResponse('Not authorized — token invalid', 401));
    }
};

module.exports = { protect };
