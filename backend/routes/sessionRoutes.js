const express = require('express');
const router = express.Router();
const { protect } = require('../src/middleware/authMiddleware');
const sessionController = require('../controllers/sessionController');

router.post('/', protect, sessionController.scheduleSession);
router.put('/:id/complete', protect, sessionController.completeSession);

module.exports = router;