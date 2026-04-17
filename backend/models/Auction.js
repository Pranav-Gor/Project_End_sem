const mongoose = require('mongoose');

/**
 * Live/upcoming/closed auction listings.
 * images[]: data URLs (e.g. data:image/jpeg;base64,...) — keep each doc under MongoDB 16MB cap.
 */
const bidEntrySchema = new mongoose.Schema(
  {
    bidderName: { type: String, required: true },
    bidderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    amount: { type: Number, required: true },
    timeLabel: { type: String, default: '' }
  },
  { _id: true }
);

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const auctionSchema = new mongoose.Schema(
  {
    auctionId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    /** Base64 data URLs or image URLs */
    images: {
      type: [String],
      default: []
    },
    startingBid: { type: Number, required: true, min: 0 },
    currentBid: { type: Number, required: true, min: 0 },
    minIncrement: { type: Number, default: 100 },
    bidCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['live', 'upcoming', 'closed'],
      default: 'live',
      index: true
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, required: true },
    seller: {
      sellerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      },
      name: { type: String, required: true },
      rating: { type: Number, default: 5 },
      reviews: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      location: { type: String, default: '' },
      memberSince: { type: String, default: '' }
    },
    bids: [bidEntrySchema],
    watchers: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    hot: { type: Boolean, default: false },
    specifications: [specSchema],
    condition: { type: String, default: '' },
    authenticity: { type: String, default: '' },
    shipping: { type: String, default: '' },
    returns: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Auction', auctionSchema);
