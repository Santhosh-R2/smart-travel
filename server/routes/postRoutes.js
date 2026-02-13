const express = require('express');
const {
    createPost,
    getPostsByPlace
} = require('../controllers/postController');

const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPost);
router.get('/place/:placeId', getPostsByPlace);

module.exports = router;
