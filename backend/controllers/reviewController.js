const Review = require('../models/review');

exports.addReview = async (req, res) => {
  try {
    const { sessionId, revieweeId, rating, comment } = req.body;
    const reviewerId = req.userId.toString();

    const review = await Review.create({ sessionId, reviewerId, revieweeId, rating, comment });
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};