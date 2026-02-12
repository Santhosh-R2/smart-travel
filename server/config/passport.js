const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User'); // Ensure this path matches your User model

// Options for JWT Strategy
const opts = {
    // Looks for the token in the header as: Authorization: Bearer <token>
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'stp_secret_key_9988'
};

module.exports = (passport) => {
    // ==========================================
    // 1. JWT STRATEGY (For Protected Routes)
    // ==========================================
    // This is used to verify the token sent from the React frontend
    passport.use(
        'jwt',
        new JwtStrategy(opts, async (jwt_payload, done) => {
            try {
                // Find the user specified in the token (ID is stored in payload)
                const user = await User.findById(jwt_payload.id);

                if (user) {
                    // Check Token Version (if present in payload)
                    if (jwt_payload.v !== undefined && jwt_payload.v < user.tokenVersion) {
                        return done(null, false);
                    }
                    // If user is found, pass it to the next middleware
                    return done(null, user);
                } else {
                    // User not found in DB
                    return done(null, false);
                }
            } catch (err) {
                console.error('Passport JWT Error:', err);
                return done(err, false);
            }
        })
    );

    // ==========================================
    // 2. LOCAL STRATEGY (For Initial Login)
    // ==========================================
    // This is used when the user submits the Login Form
    passport.use(
        new LocalStrategy(
            { usernameField: 'email' }, // We use email instead of username
            async (email, password, done) => {
                try {
                    // 1. Check if user exists
                    const user = await User.findOne({ email }).select('+password');

                    if (!user) {
                        return done(null, false, { message: 'Invalid email or user does not exist' });
                    }

                    // 2. Check password (using the matchPassword method from User model)
                    const isMatch = await user.matchPassword(password);

                    if (!isMatch) {
                        return done(null, false, { message: 'Incorrect password' });
                    }

                    // 3. Success - Pass user object
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // ==========================================
    // 3. SERIALIZATION (Standard Passport Boilerplate)
    // ==========================================
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};