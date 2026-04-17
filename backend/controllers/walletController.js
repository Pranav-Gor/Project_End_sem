const User = require('../models/User');
const WalletTopup = require('../models/WalletTopup');
const Withdrawal = require('../models/Withdrawal');

/**
 * POST /api/wallet/deposit
 * Bypass Razorpay totally: instantly update balance.
 */
exports.depositFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const amountInr = Number(amount);
    
    if (isNaN(amountInr) || amountInr <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid deposit amount.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { walletBalance: amountInr } },
      { new: true }
    );

    await WalletTopup.create({
      userId: req.user.userId,
      razorpayPaymentId: 'mock_payment_' + Date.now(),
      amountPaise: Math.round(amountInr * 100),
      amountInr,
      currency: 'INR',
      status: 'captured'
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deposited INR ${amountInr}`,
      data: { walletBalance: updatedUser.walletBalance }
    });
  } catch (error) {
    console.error('depositFunds error', error);
    res.status(500).json({ success: false, message: 'Error processing deposit.' });
  }
};

/**
 * POST /api/wallet/withdraw
 * Allows a buyer to initiate a withdrawal, moving the funds into a PENDING admin queue.
 */
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const amountInr = Number(amount);

    if (isNaN(amountInr) || amountInr <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }
    if (!bankDetails || bankDetails.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Bank details are required to process withdrawal.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if ((user.walletBalance || 0) < amountInr) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const withdrawalsToday = await Withdrawal.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: today },
          status: { $ne: 'rejected' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalWithdrawnToday = withdrawalsToday.length ? withdrawalsToday[0].total : 0;
    if (totalWithdrawnToday + amountInr > 1000000) {
      return res.status(400).json({ 
        success: false, 
        message: `Daily withdrawal limit is 10 Lakhs (₹10,00,000). You have already withdrawn/requested ₹${totalWithdrawnToday} today.` 
      });
    }

    // Deduct immediately to lock funds
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { walletBalance: -amountInr } },
      { new: true }
    );

    const withdrawal = await Withdrawal.create({
      userId: req.user.userId,
      amount: amountInr,
      bankDetails: bankDetails.trim(),
      status: 'pending'
    });

    return res.status(200).json({
      success: true,
      message: 'Withdrawal requested successfully. An admin will review it shortly.',
      data: { walletBalance: updatedUser.walletBalance, withdrawal }
    });
  } catch (error) {
    console.error('requestWithdrawal error', error);
    res.status(500).json({ success: false, message: 'Error processing withdrawal request.' });
  }
};
