const mongoose = require('mongoose');

/**
 * Successful wallet credits (INR). Idempotent per gateway payment id.
 * Legacy Stripe rows may have paymentIntentId only; Razorpay uses razorpayPaymentId.
 */
const walletTopupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    /** Legacy Stripe */
    paymentIntentId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true
    },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true
    },
    amountPaise: { type: Number, required: true },
    amountInr: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['succeeded', 'captured'], default: 'captured' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletTopup', walletTopupSchema);
