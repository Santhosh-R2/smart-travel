const Trip = require('../models/Trip');

// Create Trip
exports.createTrip = async (req, res, next) => {
    try {
        req.body.owner = req.user.id;
        const trip = await Trip.create(req.body);
        res.status(201).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

// Get User Trips
exports.getUserTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find({ owner: req.user.id }).sort({ startDate: -1 });
        res.status(200).json({ success: true, count: trips.length, data: trips });
    } catch (error) { next(error); }
};

// Get Trip By ID
exports.getTripById = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        // Auth check (Owner or Public)
        if (trip.owner.toString() !== req.user.id && !trip.isPublic && !trip.blog?.isVisibleToOthers) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

// Update Status
exports.updateTripStatus = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (trip.owner.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        trip.status = req.body.status;
        await trip.save();
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

// Add Expense
exports.addTripExpense = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        trip.budget.expenses.push(req.body);
        await trip.save();
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

// Update Blog
exports.updateTripBlog = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        trip.blog = { ...req.body, isVisibleToOthers: true, publishedDate: Date.now() };
        await trip.save();
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

// Get Public Blogs
exports.getPublicBlogs = async (req, res, next) => {
    try {
        const blogs = await Trip.find({ 'blog.isVisibleToOthers': true })
            .select('title blog owner destination startDate')
            .populate('owner', 'name email')
            .sort({ 'blog.publishedDate': -1 });
        res.status(200).json({ success: true, count: blogs.length, data: blogs });
    } catch (error) { next(error); }
};

// Delete Trip
exports.deleteTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (trip.owner.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        await Trip.deleteOne({ _id: req.params.id }); // Fixed: remove() is deprecated
        res.status(200).json({ success: true, data: {} });
    } catch (error) { next(error); }
};
