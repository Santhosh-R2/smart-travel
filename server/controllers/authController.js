const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Helper: Create JWT Token
const sendTokenResponse = (user, statusCode, res) => {
    // Include tokenVersion in payload to support invalidation
    const payload = {
        id: user._id,
        v: user.tokenVersion || 0
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            preferences: user.preferences
        }
    });
};

// @desc    Register traveler
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, profileImage, preferences } = req.body;

        // profileImage here is the Base64 string from React
        const user = await User.create({
            name,
            email,
            password,
            profileImage, // Stored as long string
            preferences
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Traveler Login
// @desc    Traveler Login
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorResponse('Please provide email and password', 400));
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check for 2FA
        if (user.isTwoFactorEnabled) {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.twoFactorCode = otp;
            user.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000; // 10 mins

            await user.save();

            // Send Email
            try {
                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });

                await transporter.sendMail({
                    from: `"Smart Travel 2FA" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: 'Your 2FA Login Code',
                    html: `<h1>${otp}</h1><p>Use this code to complete your login. Expires in 10 minutes.</p>`
                });

                return res.status(200).json({
                    success: true,
                    require2FA: true,
                    data: { email: user.email }
                });
            } catch (err) {
                user.twoFactorCode = undefined;
                user.twoFactorCodeExpires = undefined;
                await user.save();
                return next(new ErrorResponse('Email could not be sent', 500));
            }
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Verify 2FA OTP
// @route   POST /api/auth/verify2fa
exports.verifyTwoFactor = async (req, res, next) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({
            email,
            twoFactorCode: otp,
            twoFactorCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return next(new ErrorResponse('Invalid or expired OTP', 400));
        }

        // Clear OTP
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpires = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle 2FA
// @route   PUT /api/auth/toggle2fa
exports.toggleTwoFactor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.isTwoFactorEnabled = !user.isTwoFactorEnabled;
        await user.save();

        res.status(200).json({
            success: true,
            data: user.isTwoFactorEnabled
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change Password
// @route   PUT /api/auth/changepassword
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return next(new ErrorResponse('Incorrect current password', 401));
        }

        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Logout All Devices
// @route   POST /api/auth/logoutall
exports.logoutAllDevices = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.tokenVersion += 1; // Invalidate all previous tokens
        await user.save();

        res.status(200).json({ success: true, data: 'Logged out from all devices' });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin Login (Separate API)
// @route   POST /api/auth/admin/login
// @desc    Admin Login (Separate API with Master Admin check)
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            return next(new ErrorResponse('Please provide admin email and security key', 400));
        }

        // 2. Check for Master Admin (from .env)
        const MASTER_EMAIL = process.env.ADMIN_EMAIL;
        const MASTER_PASS = process.env.ADMIN_PASSWORD;

        if (email === MASTER_EMAIL && password === MASTER_PASS) {
            // Find or Create the Master Admin in DB to get an ID for the token
            let admin = await User.findOne({ email: MASTER_EMAIL });

            if (!admin) {
                // Auto-create Master Admin if not in DB
                admin = await User.create({
                    name: 'Master Admin',
                    email: MASTER_EMAIL,
                    password: MASTER_PASS,
                    role: 'admin'
                });
            }
            return sendTokenResponse(admin, 200, res);
        }

        // 3. Check for Database Admin
        // Find user by email AND explicitly check for the 'admin' role
        const user = await User.findOne({ email, role: 'admin' }).select('+password');

        if (!user) {
            return next(new ErrorResponse('Access Denied. Admin account not found.', 401));
        }

        // 4. Verify Password for DB Admin
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return next(new ErrorResponse('Unauthorized Access. Invalid credentials.', 401));
        }

        // 5. Success
        sendTokenResponse(user, 200, res);

    } catch (err) {
        next(err);
    }
};

// @desc    Update Profile (Includes Base64 Image update)
// @route   PUT /api/auth/updateprofile
exports.updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            profileImage: req.body.profileImage, // Base64 string
            preferences: req.body.preferences
        };

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Forgot Password - Send OTP Email
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return next(new ErrorResponse('There is no user with that email', 404));
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (Expires in 10 mins)
        user.otpCode = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Create Transporter (Use Gmail or SendGrid)
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Smart Travel Planner" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Your Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4A90E2;">Password Reset Request</h2>
                    <p>You requested a password reset for your Smart Travel Planner account.</p>
                    <p>Your OTP code is:</p>
                    <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px; color: #333;">${otp}</h1>
                    <p>This code expires in 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, data: 'OTP sent to email' });

    } catch (err) {
        next(err);
    }
};

// @desc    Reset Password using OTP
// @route   PUT /api/auth/resetpassword
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            otpCode: otp,
            otpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return next(new ErrorResponse('Invalid or expired OTP', 400));
        }

        // Set new password
        user.password = newPassword;
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, data: 'Password reset successful' });
    } catch (err) {
        next(err);
    }
};