const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    sellerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'settled', 'failed', 'rejected'],
      default: 'pending',
      index: true
    },
    razorpayPayoutId: {
      type: String,
      unique: true,
      sparse: true
    },
    utr: {
      type: String,
      default: null
    },
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    },
    settledAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
