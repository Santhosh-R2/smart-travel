const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        sender: { type: String, enum: ['user', 'ai'], required: true },
        text: { type: String, required: true },
        suggestions: { type: Array, default: [] },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
