const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { getLiveAuctions, getUpcomingAuctions, getAuctionById, placeBid } = require('../controllers/auctionController');

const router = express.Router();

router.get('/live', getLiveAuctions);
router.get('/upcoming', getUpcomingAuctions);
router.post(
  '/:auctionId/bid',
  protect,
  [body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number')],
  placeBid
);
router.get('/:auctionId', getAuctionById);

module.exports = router;
