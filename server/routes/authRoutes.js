const express = require('express');
const router = express.Router();

// Import Controller Methods
const {
    register,
    login,
    adminLogin,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyTwoFactor,
    toggleTwoFactor,
    changePassword,
    logoutAllDevices
} = require('../controllers/authController');

// Import Middleware
// protect: Ensures the user is logged in
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// PUBLIC ROUTES (No Token Required)
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new traveler (Handles Base64 Profile Image)
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate traveler & get token
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/admin/login
 * @desc    Separate login endpoint for system administrators
 */
router.post('/admin/login', adminLogin);

/**
 * @route   POST /api/auth/forgotpassword
 * @desc    Request OTP for password reset
 */
router.post('/forgotpassword', forgotPassword);

/**
 * @route   PUT /api/auth/resetpassword
 * @desc    Reset password using the 6-digit OTP received via email
 */
router.put('/resetpassword', resetPassword);

/**
 * @route   POST /api/auth/verify2fa
 * @desc    Verify OTP for 2FA Login
 */
router.post('/verify2fa', verifyTwoFactor);

// ==========================================
// PRIVATE ROUTES (JWT Token Required)
// ==========================================

/**
 * @route   PUT /api/auth/toggle2fa
 * @desc    Enable/Disable 2FA
 * @access  Private
 */
router.put('/toggle2fa', protect, toggleTwoFactor);

/**
 * @route   PUT /api/auth/changepassword
 * @desc    Change User Password
 * @access  Private
 */
router.put('/changepassword', protect, changePassword);

/**
 * @route   POST /api/auth/logoutall
 * @desc    Log out from all devices (Invalidate tokens)
 * @access  Private
 */
router.post('/logoutall', protect, logoutAllDevices);

/**
 * @route   PUT /api/auth/updateprofile
 * @desc    Update traveler name, preferences, or profile image
 * @access  Private
 */
router.put('/updateprofile', protect, updateProfile);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user data
 * @access  Private
 */
// This is useful for the React frontend to keep the user logged in on refresh
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
});

module.exports = router;