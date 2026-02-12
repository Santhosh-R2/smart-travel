const mongoose = require('mongoose');

const poiSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: String,
    category: { 
        type: String, 
        enum: ['museum', 'park', 'restaurant', 'landmark', 'mall'], 
        required: true 
    },
    // Geospatial data for Map integration
    location: {
        type: { type: String, default: 'Point' },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere' // Critical for proximity searches
        },
        address: String
    },
    averageTimeSpent: { type: Number, default: 60 }, // in minutes (for AI planning)
    openingHours: {
        open: String, // e.g., "09:00"
        close: String  // e.g., "18:00"
    },
    rating: { type: Number, default: 0 },
    costLevel: { type: Number, min: 1, max: 3 }, // 1=$, 2=$$, 3=$$$
    imageUrl: String
});

module.exports = mongoose.model('POI', poiSchema);