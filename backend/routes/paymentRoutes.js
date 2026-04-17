const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  createRazorpayOrder,
  verifyRazorpayWallet
} = require('../controllers/paymentController');

function requireRazorpayVerifyFields(req, res, next) {
  const orderId = String(
    req.body.razorpay_order_id || req.body.order_id || ''
  ).trim();
  const paymentId = String(
    req.body.razorpay_payment_id || req.body.payment_id || ''
  ).trim();
  const signature = String(
    req.body.razorpay_signature || req.body.signature || ''
  ).trim();
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      message:
        'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required (Checkout response fields).'
    });
  }
  req.body._orderId = orderId;
  req.body._paymentId = paymentId;
  req.body._signature = signature;
  next();
}

const router = express.Router();

router.use(protect);

router.post(
  '/create-razorpay-order',
  [
    body('amountInr')
      .isFloat({ min: 1, max: 1_000_000 })
      .withMessage('amountInr must be a number between 1 and 1000000')
  ],
  createRazorpayOrder
);

router.post('/verify-razorpay-wallet', requireRazorpayVerifyFields, verifyRazorpayWallet);

module.exports = router;
