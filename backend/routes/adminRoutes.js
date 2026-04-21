const express = require('express');
const { listSellerApplications, reviewSellerApplication, listFinancialRequests, processFinancialRequest, getMetrics, adminWithdraw } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/seller-applications', listSellerApplications);
router.patch('/seller-applications/:id', reviewSellerApplication);

router.get('/financials', listFinancialRequests);
router.patch('/financials/:id/:type', processFinancialRequest);

router.get('/metrics', getMetrics);
router.post('/withdraw', adminWithdraw);

module.exports = router;
