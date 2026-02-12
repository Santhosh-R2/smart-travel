const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    profileImage: {
        type: String,
        default: 'default-avatar.png' // URL to Cloudinary or S3 bucket
    },
    role: {
        type: String,
        enum: ['traveler', 'admin'],
        default: 'traveler'
    },
    otpCode: String,
    otpExpire: Date,
    // AI Engine Data: Personalized preferences
    preferences: {
        interests: [{ type: String, enum: ['culture', 'nature', 'food', 'adventure', 'shopping', 'nightlife'] }],
        travelPace: { type: String, enum: ['relaxed', 'balanced', 'fast-paced'], default: 'balanced' },
        budgetLevel: { type: String, enum: ['budget', 'mid-range', 'luxury'], default: 'mid-range' }
    },
    // Security Fields
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorCode: { type: String },
    twoFactorCodeExpires: { type: Date },
    tokenVersion: { type: Number, default: 0 }, // For "Logout All"
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);