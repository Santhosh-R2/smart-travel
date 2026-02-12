const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    tags: [String],
    budget_range: String,
    description: String,
    image_url: String
});

module.exports = mongoose.model('Destination', destinationSchema);
