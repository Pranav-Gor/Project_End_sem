const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { getLiveAuctions, getUpcomingAuctions, getClosedAuctions, getAuctionById, placeBid, toggleNotifyMe, getAuctionContactInfo, getMyBids, getPendingNotifications, markNotificationRead } = require('../controllers/auctionController');

const router = express.Router();

router.get('/notifications/pending', protect, getPendingNotifications);
router.post('/notifications/mark-read', protect, markNotificationRead);
router.get('/my-bids', protect, getMyBids);
router.get('/live', getLiveAuctions);
router.get('/upcoming', getUpcomingAuctions);
router.post(
  '/:auctionId/bid',
  protect,
  [body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number')],
  placeBid
);
router.post('/:auctionId/notify', protect, toggleNotifyMe);
router.get('/closed', getClosedAuctions);
router.get('/:id/contact-info', protect, getAuctionContactInfo);
router.get('/:auctionId', getAuctionById);

module.exports = router;
