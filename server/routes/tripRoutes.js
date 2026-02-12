const express = require('express');
const router = express.Router();
const {
    createTrip,
    getUserTrips,
    getTripById,
    updateTripStatus,
    addTripExpense,
    updateTripBlog,
    getPublicBlogs,
    deleteTrip
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getUserTrips).post(protect, createTrip);
router.route('/public-blogs').get(getPublicBlogs);
router.route('/:id').get(protect, getTripById).delete(protect, deleteTrip);
router.route('/:id/status').put(protect, updateTripStatus);
router.route('/:id/expenses').post(protect, addTripExpense);
router.route('/:id/blog').put(protect, updateTripBlog);

module.exports = router;
