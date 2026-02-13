const mongoose = require('mongoose');

const poiSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: String,
    category: { 
        type: String, 
        enum: ['museum', 'park', 'restaurant', 'landmark', 'mall'], 
        required: true 
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: {
            type: [Number], 
            index: '2dsphere' 
        },
        address: String
    },
    averageTimeSpent: { type: Number, default: 60 }, 
    openingHours: {
        open: String, 
        close: String  
    },
    rating: { type: Number, default: 0 },
    costLevel: { type: Number, min: 1, max: 3 }, 
    imageUrl: String
});

module.exports = mongoose.model('POI', poiSchema);