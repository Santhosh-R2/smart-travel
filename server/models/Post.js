const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    placeId: {
        type: String,
        required: true,
        index: true
    },
    placeName: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: [true, 'Please add some content'],
        trim: true
    },
    image: {
        type: String 
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
