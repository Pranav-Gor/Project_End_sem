const express = require('express');
const { subscribe, broadcast } = require('../controllers/newsletterController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public route for users to subscribe from the homepage
router.post('/subscribe', subscribe);

// Protected admin route to broadcast messages
router.post('/broadcast', protect, restrictTo('admin'), broadcast);

module.exports = router;
