const { validationResult } = require('express-validator');
const Auction = require('../models/Auction');
const User = require('../models/User');

function msToTimeLeft(ms) {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 };
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { hours, minutes, seconds };
}

function mapDetail(doc) {
  const ends = new Date(doc.endsAt).getTime();
  const tl = msToTimeLeft(ends - Date.now());
  return {
    id: doc.auctionId,
    title: doc.title,
    category: doc.category,
    description: doc.description,
    images: doc.images || [],
    currentBid: doc.currentBid,
    startingBid: doc.startingBid,
    minIncrement: doc.minIncrement ?? 100,
    bids: (doc.bids || []).map((b) => ({
      id: b._id?.toString() || String(Math.random()),
      bidder: b.bidderName,
      amount: b.amount,
      time: b.timeLabel || ''
    })),
    timeLeft: tl,
    endsAt: doc.endsAt,
    seller: {
      name: doc.seller?.name,
      rating: doc.seller?.rating,
      reviews: doc.seller?.reviews,
      sales: doc.seller?.sales,
      location: doc.seller?.location,
      memberSince: doc.seller?.memberSince
    },
    watchers: doc.watchers,
    condition: doc.condition,
    authenticity: doc.authenticity,
    shipping: doc.shipping,
    returns: doc.returns,
    specifications: doc.specifications || []
  };
}

/**
 * GET /api/auctions/live
 */
exports.getLiveAuctions = async (req, res) => {
  try {
    const rows = await Auction.find({ status: 'live' })
      .sort({ endsAt: 1 })
      .lean();

    const auctions = rows.map((a) => ({
      id: a.auctionId,
      title: a.title,
      category: a.category,
      image: a.images?.[0] || '',
      currentBid: a.currentBid,
      startingBid: a.startingBid,
      bids: a.bidCount,
      endsAt: a.endsAt,
      seller: a.seller?.name,
      sellerRating: a.seller?.rating,
      watchers: a.watchers,
      featured: a.featured,
      hot: a.hot
    }));

    res.json({
      success: true,
      data: { auctions }
    });
  } catch (e) {
    console.error('getLiveAuctions', e);
    res.status(500).json({ success: false, message: 'Failed to load auctions' });
  }
};

/**
 * GET /api/auctions/upcoming
 * Public — returns the 3 nearest upcoming auctions whose startsAt (or endsAt fallback)
 * is within the next 7 days, sorted by nearest start time.
 */
exports.getUpcomingAuctions = async (req, res) => {
  try {
    const now = new Date();
    const showAll = req.query.all === 'true';
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dateFilter = showAll
      ? {} // no date restriction — return all upcoming
      : {
        $or: [
          { startsAt: { $gte: now, $lte: in7Days } },
          { startsAt: null, endsAt: { $gte: now, $lte: in7Days } }
        ]
      };

    const rows = await Auction.find({ status: 'upcoming', ...dateFilter })
      .sort({ startsAt: 1, endsAt: 1 })
      .limit(showAll ? 200 : 3)
      .lean();

    const auctions = rows.map((a) => {
      try {
        const startTime = a.startsAt || a.endsAt;
        if (!startTime) {
          throw new Error('Auction missing start/end time');
        }

        const diffMs = new Date(startTime).getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let startsIn;
        if (diffDays <= 0 && diffHours < 1) {
          startsIn = 'Starting very soon';
        } else if (diffDays === 0) {
          startsIn = `Today in ${diffHours}h`;
        } else if (diffDays === 1) {
          const d = new Date(startTime);
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          startsIn = `Tomorrow, ${timeStr}`;
        } else {
          startsIn = `In ${diffDays} Days`;
        }

        return {
          id: a.auctionId,
          title: a.title,
          category: a.category,
          description: a.description,
          images: Array.isArray(a.images) ? a.images : [],
          startingBid: a.startingBid,
          estimatedValue: `₹${Number(a.startingBid || 0).toLocaleString('en-IN')}+`,
          startsAt: startTime,
          startsIn,
          watchers: a.watchers || 0,
          hypeStats: {
            followers: a.watchers ? `${(a.watchers / 1000).toFixed(1)}k` : '0',
            expectedBidders: `${Math.round((a.watchers || 0) * 0.3)}+`
          }
        };
      } catch (err) {
        console.error(`Error mapping upcoming auction ${a.auctionId || a._id}:`, err.message);
        // Skip this one or return a minimal object? Better skip or handle.
        return null;
      }
    }).filter(Boolean); // Remote failed maps

    res.json({
      success: true,
      data: { auctions }
    });
  } catch (e) {
    console.error('getUpcomingAuctions Error:', e.stack || e);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load upcoming auctions',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined 
    });
  }
};



/**
 * GET /api/auctions/:auctionId
 */
exports.getAuctionById = async (req, res) => {
  try {
    const auctionId = parseInt(req.params.auctionId, 10);
    if (Number.isNaN(auctionId)) {
      return res.status(400).json({ success: false, message: 'Invalid auction id' });
    }

    const doc = await Auction.findOne({ auctionId }).lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    res.json({
      success: true,
      data: { auction: mapDetail(doc) }
    });
  } catch (e) {
    console.error('getAuctionById', e);
    res.status(500).json({ success: false, message: 'Failed to load auction' });
  }
};

/**
 * POST /api/auctions/:auctionId/bid
 * Body: { amount } — whole INR. Debits bidder wallet only (Stripe not used here).
 * Refunds previous high bidder when someone outbids them.
 */
exports.placeBid = async (req, res) => {
  try {
    const val = validationResult(req);
    if (!val.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: val.array()[0]?.msg || 'Validation failed'
      });
    }

    const auctionId = parseInt(req.params.auctionId, 10);
    const amount = Number(req.body.amount);
    if (Number.isNaN(auctionId) || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid auction or bid amount' });
    }

    const bidder = await User.findById(req.user.userId);
    if (!bidder) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const auction = await Auction.findOne({ auctionId });
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }
    if (auction.status !== 'live') {
      return res.status(400).json({ success: false, message: 'This auction is not accepting bids' });
    }
    if (new Date(auction.endsAt).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Auction has ended' });
    }

    const minInc = auction.minIncrement ?? 100;
    const minBid = auction.currentBid + minInc;
    if (amount < minBid) {
      return res.status(400).json({
        success: false,
        message: `Your bid must be at least ${minBid} INR`,
        data: { minBid }
      });
    }

    const lastBid =
      auction.bids && auction.bids.length > 0 ? auction.bids[auction.bids.length - 1] : null;

    let chargeAmount = amount;
    let refundUserId = null;
    let refundAmount = 0;

    if (lastBid && lastBid.bidderUserId) {
      const lastId = String(lastBid.bidderUserId);
      const myId = String(bidder._id);
      if (lastId === myId) {
        const increment = amount - lastBid.amount;
        if (increment < minInc) {
          return res.status(400).json({
            success: false,
            message: `Increase your bid by at least ${minInc} INR`,
            data: { minBid: lastBid.amount + minInc }
          });
        }
        chargeAmount = increment;
      } else {
        refundUserId = lastBid.bidderUserId;
        refundAmount = lastBid.amount;
      }
    }

    if (refundUserId) {
      await User.findByIdAndUpdate(refundUserId, { $inc: { walletBalance: refundAmount } });
    }

    const debited = await User.findOneAndUpdate(
      { _id: bidder._id, walletBalance: { $gte: chargeAmount } },
      { $inc: { walletBalance: -chargeAmount } },
      { new: true }
    );

    if (!debited) {
      if (refundUserId) {
        await User.findByIdAndUpdate(refundUserId, { $inc: { walletBalance: -refundAmount } });
      }
      const fresh = await User.findById(bidder._id);
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_WALLET',
        message: 'Not enough wallet balance for this bid. Add funds to your wallet first.',
        data: {
          requiredInr: chargeAmount,
          walletBalance: fresh?.walletBalance ?? 0
        }
      });
    }

    const timeLabel = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    auction.bids.push({
      bidderName: bidder.name || 'Bidder',
      bidderUserId: bidder._id,
      amount,
      timeLabel
    });
    auction.currentBid = amount;
    auction.bidCount = (auction.bidCount || 0) + 1;
    await auction.save();

    const lean = await Auction.findOne({ auctionId }).lean();

    return res.status(201).json({
      success: true,
      message: 'Bid placed',
      data: {
        auction: mapDetail(lean),
        walletBalance: debited.walletBalance
      }
    });
  } catch (e) {
    console.error('placeBid', e);
    return res.status(500).json({ success: false, message: 'Failed to place bid' });
  }
};
