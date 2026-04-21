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
    specifications: doc.specifications || [],
    watchersList: (doc.watchersList || []).map(id => id.toString())
  };
}

/**
 * GET /api/auctions/live
 */
exports.getLiveAuctions = async (req, res) => {
  try {
    const now = new Date();
    // Ensure we only fetch auctions whose endsAt is strictly in the future.
    const rows = await Auction.find({ status: 'live', endsAt: { $gt: now } })
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
 * GET /api/auctions/closed
 * Public/Protected — returns auctions that have ended
 */
exports.getClosedAuctions = async (req, res) => {
  try {
    const now = new Date();
    const rows = await Auction.find({
      $or: [
        { status: 'closed' },
        { status: 'live', endsAt: { $lte: now } }
      ]
    })
      .sort({ endsAt: -1 })
      .lean();

    const auctions = rows.map((a) => {
      const winnerName = a.bids && a.bids.length > 0 ? a.bids[a.bids.length - 1].bidderName : 'No Winner';
      return {
        id: a.auctionId,
        title: a.title,
        category: a.category,
        image: a.images?.[0] || '',
        finalBid: a.currentBid || a.startingBid,
        totalBids: a.bidCount || 0,
        soldDate: a.endsAt,
        winner: winnerName,
        seller: a.seller?.name || 'Unknown',
        sellerRating: a.seller?.rating || 0,
        views: a.watchers || 0
      };
    });

    res.json({
      success: true,
      data: { auctions }
    });
  } catch (e) {
    console.error('getClosedAuctions Error:', e);
    res.status(500).json({ success: false, message: 'Failed to load closed auctions' });
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
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Require an address before bidding
    if (!user.profile?.address?.street || !user.profile?.address?.city || !user.profile?.address?.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please update your address in your Profile before placing a bid. This ensures sellers know where to ship your won items.',
        code: 'MISSING_ADDRESS'
      });
    }

    if (Number.isNaN(auctionId) || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid auction or bid amount' });
    }

    const bidder = user;

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

    const newBidObj = {
      bidderName: bidder.name || 'Bidder',
      bidderUserId: bidder._id,
      amount,
      timeLabel
    };

    auction.bids.push(newBidObj);
    auction.currentBid = amount;
    auction.bidCount = (auction.bidCount || 0) + 1;
    await auction.save();

    const lean = await Auction.findOne({ auctionId }).lean();

    // Broadcast optimized update to connected clients
    try {
      const { getIO } = require('../socket');
      // Format the bid object to match frontend expectations
      const frontendBid = {
        id: auction.bids[auction.bids.length - 1]._id?.toString() || String(Math.random()),
        bidder: newBidObj.bidderName,
        amount: newBidObj.amount,
        time: newBidObj.timeLabel
      };
      getIO().to(`auction_${auctionId}`).emit('new_bid', {
        newBid: frontendBid,
        currentBid: auction.currentBid,
        bidCount: auction.bidCount
      });
    } catch (err) {
      console.error('Socket emission failed:', err);
    }

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

/**
 * POST /api/auctions/:auctionId/notify
 * Toggle user in watchersList for an upcoming auction.
 */
exports.toggleNotifyMe = async (req, res) => {
  try {
    const auctionId = parseInt(req.params.auctionId, 10);
    const userId = req.user.userId;

    if (Number.isNaN(auctionId)) {
      return res.status(400).json({ success: false, message: 'Invalid auction id' });
    }

    const auction = await Auction.findOne({ auctionId });
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.status !== 'upcoming') {
      return res.status(400).json({ success: false, message: 'Can only watch upcoming auctions' });
    }

    const userObjId = await User.findOne({ userId }).select('_id');
    if (!userObjId) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let isWatching = false;
    const watcherIndex = auction.watchersList.indexOf(userObjId._id);

    if (watcherIndex > -1) {
      auction.watchersList.splice(watcherIndex, 1);
      auction.watchers = Math.max(0, auction.watchers - 1);
      isWatching = false;
    } else {
      auction.watchersList.push(userObjId._id);
      auction.watchers += 1;
      isWatching = true;
    }

    await auction.save();

    res.json({
      success: true,
      message: isWatching ? 'You will be notified when this auction starts' : 'Notification removed',
      data: { isWatching, watchersCount: auction.watchers }
    });
  } catch (error) {
    console.error('toggleNotifyMe error:', error);
    res.status(500).json({ success: false, message: 'Server error toggling notification.' });
  }
};

/**
 * GET /api/auctions/:id/contact-info
 * For a closed auction, returns the contact info of the seller to the winner, and winner to the seller.
 */
exports.getAuctionContactInfo = async (req, res) => {
  try {
    const auction = await Auction.findOne({ auctionId: req.params.id })
      .populate('seller.sellerUserId', 'name email profile.phone')
      .populate('bids.bidderUserId', 'name email profile.phone');

    if (!auction) return res.status(404).json({ success: false, message: 'Not found' });
    if (auction.status !== 'closed') return res.status(400).json({ success: false, message: 'Auction not closed yet' });

    const winningBid = auction.bids.length > 0 ? auction.bids[auction.bids.length - 1] : null;
    if (!winningBid) return res.status(400).json({ success: false, message: 'No bids' });

    const isSeller = auction.seller.sellerUserId && auction.seller.sellerUserId._id.toString() === req.user._id.toString();
    const isWinner = winningBid.bidderUserId && winningBid.bidderUserId._id.toString() === req.user._id.toString();

    if (isSeller) {
      return res.json({
        success: true,
        data: {
          role: 'seller',
          winner: {
            name: winningBid.bidderUserId.name,
            email: winningBid.bidderUserId.email,
            phone: winningBid.bidderUserId.profile?.phone || 'Not provided'
          },
          winningBid: winningBid.amount
        }
      });
    }

    if (isWinner) {
      return res.json({
        success: true,
        data: {
          role: 'winner',
          seller: {
            name: auction.seller.sellerUserId.name,
            email: auction.seller.sellerUserId.email,
            phone: auction.seller.sellerUserId.profile?.phone || 'Not provided'
          },
          winningBid: winningBid.amount
        }
      });
    }

    return res.status(403).json({ success: false, message: 'Not authorized to view contact info' });

  } catch (error) {
    console.error('getAuctionContactInfo error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/auctions/notifications/pending
 * Returns unacknowledged won and sold auctions for the logged-in user.
 */
exports.getPendingNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Seller not notified:
    const soldAuctions = await Auction.find({
      status: 'closed',
      'seller.sellerUserId': userId,
      sellerNotified: false
    }).populate('bids.bidderUserId', 'name email profile.phone').lean();

    // Winner not notified:
    // We fetch all where winnerNotified = false and then filter to those where this user won
    const potentialWonAuctions = await Auction.find({
      status: 'closed',
      winnerNotified: false
    }).populate('seller.sellerUserId', 'name email profile.phone').lean();

    const wonAuctions = potentialWonAuctions.filter(a => {
      if (a.bids && a.bids.length > 0) {
        const lastBid = a.bids[a.bids.length - 1];
        return lastBid.bidderUserId && lastBid.bidderUserId._id.toString() === userId.toString();
      }
      return false;
    });

    res.json({
      success: true,
      data: {
        sold: soldAuctions.map(a => {
          const winningBid = a.bids.length > 0 ? a.bids[a.bids.length - 1] : null;
          return {
            auctionId: a.auctionId,
            title: a.title,
            finalBid: winningBid ? winningBid.amount : a.startingBid,
            winner: winningBid && winningBid.bidderUserId ? {
              name: winningBid.bidderUserId.name,
              email: winningBid.bidderUserId.email,
              phone: winningBid.bidderUserId.profile?.phone || 'Not provided'
            } : null
          };
        }),
        won: wonAuctions.map(a => {
          const winningBid = a.bids[a.bids.length - 1];
          return {
            auctionId: a.auctionId,
            title: a.title,
            finalBid: winningBid.amount,
            seller: a.seller.sellerUserId ? {
              name: a.seller.sellerUserId.name,
              email: a.seller.sellerUserId.email,
              phone: a.seller.sellerUserId.profile?.phone || 'Not provided'
            } : null
          };
        })
      }
    });

  } catch (e) {
    console.error('getPendingNotifications', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/auctions/notifications/mark-read
 * Body: { type: 'winner' | 'seller', auctionId }
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const { type, auctionId } = req.body;
    const updateField = type === 'seller' ? { sellerNotified: true } : { winnerNotified: true };
    await Auction.updateOne({ auctionId }, { $set: updateField });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

/**
 * GET /api/auctions/my-bids
 * Protected - fetch auctions the user has bid on with their highest bid and current status
 */
exports.getMyBids = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Find all auctions where the user has placed at least one bid
    const auctions = await Auction.find({ 'bids.bidderUserId': userId }).lean();

    const now = Date.now();

    const myBidsData = auctions.map(a => {
      const isClosed = a.status === 'closed' || new Date(a.endsAt).getTime() <= now;

      // Find user's highest bid
      const userBids = (a.bids || []).filter(b => b.bidderUserId && b.bidderUserId.toString() === userId.toString());
      const myMaxBid = userBids.length > 0 ? Math.max(...userBids.map(b => b.amount)) : 0;

      // Check if user is the current top bidder
      const isTopBidder = myMaxBid >= (a.currentBid || 0) && userBids.some(b => b.amount === a.currentBid);

      let status;
      if (isClosed) {
        if (a.winner && String(a.winner) === String(userId)) {
          status = 'won';
        } else if (isTopBidder) {
          status = 'won'; // Fallback if winner isn't explicitly set yet
        } else {
          status = 'lost';
        }
      } else {
        if (isTopBidder) {
          status = 'winning';
        } else {
          status = 'outbid';
        }
      }

      const msLeft = new Date(a.endsAt).getTime() - now;
      let timeLeft = null;
      if (!isClosed && msLeft > 0) {
        const totalSec = Math.floor(msLeft / 1000);
        timeLeft = {
          hours: Math.floor(totalSec / 3600),
          minutes: Math.floor((totalSec % 3600) / 60)
        };
      }

      let endDate = null;
      if (isClosed) {
        endDate = new Date(a.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      return {
        id: a.auctionId,
        title: a.title,
        category: a.category,
        image: a.images?.[0] || '',
        myBid: myMaxBid,
        currentBid: a.currentBid || 0,
        status,
        timeLeft,
        endDate,
        seller: a.seller?.name || 'Unknown',
        bids: a.bids?.length || 0
      };
    });

    res.json({ success: true, data: myBidsData });
  } catch (error) {
    console.error('Failed to fetch my bids:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bids' });
  }
};
