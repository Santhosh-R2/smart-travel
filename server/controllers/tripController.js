const Trip = require('../models/Trip');

exports.createTrip = async (req, res, next) => {
    try {
        req.body.owner = req.user.id;
        const trip = await Trip.create(req.body);
        res.status(201).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

exports.getUserTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find({ owner: req.user.id }).sort({ startDate: -1 });
        res.status(200).json({ success: true, count: trips.length, data: trips });
    } catch (error) { next(error); }
};

exports.getTripById = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        if (trip.owner.toString() !== req.user.id && !trip.isPublic && !trip.blog?.isVisibleToOthers) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

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

exports.addTripExpense = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        trip.budget.expenses.push(req.body);
        await trip.save();
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

exports.updateTripBlog = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        trip.blog = { ...req.body, isVisibleToOthers: true, publishedDate: Date.now() };
        await trip.save();
        res.status(200).json({ success: true, data: trip });
    } catch (error) { next(error); }
};

exports.getPublicBlogs = async (req, res, next) => {
    try {
        const blogs = await Trip.find({ 'blog.isVisibleToOthers': true })
            .select('title blog owner destination startDate')
            .populate('owner', 'name email profileImage')
            .sort({ 'blog.publishedDate': -1 });
        res.status(200).json({ success: true, count: blogs.length, data: blogs });
    } catch (error) { next(error); }
};

exports.getBlogsByCity = async (req, res, next) => {
    try {
        const searchTerm = req.params.city;
        const regex = new RegExp(searchTerm, 'i');

        const blogs = await Trip.find({
            $or: [
                { 'destination.city': regex },
                { 'title': regex },
                { 'blog.title': regex }
            ],
            'blog.isVisibleToOthers': true,
            status: 'completed'
        })
            .select('title blog owner destination startDate')
            .populate('owner', 'name profileImage')
            .sort({ 'blog.publishedDate': -1 });

        res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
        if (trip.owner.toString() !== req.user.id) return res.status(401).json({ success: false, error: 'Not authorized' });

        await Trip.deleteOne({ _id: req.params.id }); 
        res.status(200).json({ success: true, data: {} });
    } catch (error) { next(error); }
};
