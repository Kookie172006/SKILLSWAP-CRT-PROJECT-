const express = require('express');
const router = express.Router();
const { protect } = require('../src/middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

// New route to fetch reviews
router.get('/', reviewController.getReviews);

// Existing route to post a review
router.post('/', protect, reviewController.addReview);

module.exports = router;


