const express = require('express');
const { protectAllowInactive, restrictTo } = require('../middleware/auth');
const { getSellerAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

// Seller must be authenticated and have seller or admin role
router.use(protectAllowInactive);
router.use(restrictTo('seller', 'admin'));

router.get('/dashboard', getSellerAnalytics);

module.exports = router;
