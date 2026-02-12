const passport = require('passport');

/**
 * @desc    Middleware to verify the JWT token and attach user to req.user
 * @access  Private
 */
const protect = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please log in.'
            });
        }

        // Attach the full user object (with preferences and profile image) to the request
        req.user = user;
        next();
    })(req, res, next);
};

/**
 * @desc    Middleware to restrict access based on User Roles
 * @param   {...string} roles - Allowed roles (e.g., 'admin', 'traveler')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this resource`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };