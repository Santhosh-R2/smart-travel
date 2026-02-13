const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
    poi: { type: mongoose.Schema.Types.ObjectId, ref: 'POI' },
    startTime: Date,
    endTime: Date,
    notes: String,
    order: Number 
});

const daySchema = new mongoose.Schema({
    dayNumber: Number,
    date: Date,
    activities: [itineraryItemSchema]
});

const tripSchema = new mongoose.Schema({
    title: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    destination: {
        city: String,
        country: String,
        image: String 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    transportMode: { type: String }, 
    passengerCount: { type: Number, default: 1 },
    isHoliday: { type: Boolean, default: false },
    distance: { type: Number }, 
    preferences: {
        accommodation: { type: Boolean, default: true },
        meals: {
            breakfast: { type: Boolean, default: true },
            lunch: { type: Boolean, default: true },
            dinner: { type: Boolean, default: true }
        }
    },
    budget: {
        totalCost: { type: Number, default: 0 }, 
        currency: { type: String, default: 'INR' },
        breakdown: { 
            transport: { type: Number, default: 0 },
            food: { type: Number, default: 0 },
            accommodation: { type: Number, default: 0 },
            miscellaneous: { type: Number, default: 0 }
        },
        tips: { type: String },
        expenses: [{ 
            description: String,
            amount: Number,
            category: { type: String, enum: ['Food', 'Transport', 'Accommodation', 'Miscellaneous', 'Fuel', 'Tickets'] },
            date: { type: Date, default: Date.now }
        }]
    },
    itinerary: [daySchema],

    blog: {
        title: String,
        content: String,
        photos: [String], 
        isVisibleToOthers: { type: Boolean, default: false },
        publishedDate: Date
    },

    isPublic: { type: Boolean, default: false },
    status: { type: String, enum: ['planning', 'ongoing', 'completed', 'cancelled'], default: 'planning' }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);