const express = require('express');
const router = express.Router();
const { getTouristPlaces, fetchDetails, estimateTripCost } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, getTouristPlaces);
router.get('/photos/:xid', fetchDetails);
router.post('/estimate-cost', protect, estimateTripCost);

module.exports = router;