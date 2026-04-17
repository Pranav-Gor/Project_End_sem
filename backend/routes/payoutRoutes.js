const express = require('express');
const { protectAllowInactive, restrictTo } = require('../middleware/auth');
const { getSellerPayouts, requestPayout } = require('../controllers/payoutController');

const router = express.Router();

// Seller must be authenticated and have seller or admin role
router.use(protectAllowInactive);
router.use(restrictTo('seller', 'admin'));

router.get('/me', getSellerPayouts);
router.post('/request', requestPayout);

module.exports = router;
