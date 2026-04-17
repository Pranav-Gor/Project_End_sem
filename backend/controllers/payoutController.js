const Payout = require('../models/Payout');
const Auction = require('../models/Auction');
const mongoose = require('mongoose');

/**
 * GET /api/seller/payouts
 * Fetch payout history and calculate total pending/settled balance.
 */
exports.getSellerPayouts = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 1. Fetch all payouts
    const payouts = await Payout.find({ sellerUserId: userId }).sort({ createdAt: -1 }).lean();
    
    // 2. Calculate balance logic from auctions
    const closedAuctions = await Auction.find({ 
      'seller.sellerUserId': userId, 
      status: 'closed' 
    }).lean();
    
    const totalGross = closedAuctions.reduce((sum, a) => sum + (a.currentBid || 0), 0);
    const totalNetAvailable = totalGross * 0.90; // After 10% fee
    const totalPaidOut = payouts
      .filter(p => ['processed', 'settled'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const balance = Math.max(0, totalNetAvailable - totalPaidOut);

    res.status(200).json({
      success: true,
      data: {
        payouts,
        closedAuctions,
        stats: {
          totalGross,
          totalNetAvailable,
          totalPaidOut,
          balance
        }
      }
    });
  } catch (e) {
    console.error('getSellerPayouts Error', e);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts' });
  }
};

/**
 * POST /api/seller/payouts/request
 * Simulate initiating a payout to the seller.
 */
exports.requestPayout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payout amount' });
    }

    // Check balance before allowing payout
    const closedAuctions = await Auction.find({ 'seller.sellerUserId': userId, status: 'closed' }).lean();
    const totalNet = closedAuctions.reduce((sum, a) => sum + (a.currentBid || 0), 0) * 0.90;
    
    const existingPayouts = await Payout.find({ sellerUserId: userId, status: { $in: ['pending', 'processing', 'processed', 'settled'] } }).lean();
    const totalInitiated = existingPayouts.reduce((sum, p) => sum + p.amount, 0);
    
    if (amount > (totalNet - totalInitiated + 1)) { // +1 for small rounding floating point issues
      return res.status(400).json({ success: false, message: 'Insufficient balance for this payout' });
    }

    const payoutId = `pout_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPayout = await Payout.create({
      sellerUserId: userId,
      amount,
      status: 'pending',
      razorpayPayoutId: payoutId,
      initiatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Payout requested successfully. A platform admin will review and process this shortly.',
      data: {
        payoutId: newPayout.razorpayPayoutId,
        status: newPayout.status
      }
    });

  } catch (e) {
    console.error('requestPayout Error', e);
    res.status(500).json({ success: false, message: 'Failed to initiate payout' });
  }
};
