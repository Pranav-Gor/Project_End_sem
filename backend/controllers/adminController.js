const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
const Payout = require('../models/Payout');
const Withdrawal = require('../models/Withdrawal');
const {
  sendSellerApprovalEmail,
  sendSellerRejectionEmail
} = require('../utils/emailService');

function generateTemporaryPassword() {
  const rand = Math.random().toString(36).slice(-6);
  return `Auctus@${Date.now().toString().slice(-6)}${rand}`;
}

/**
 * GET /api/admin/seller-applications
 */
exports.listSellerApplications = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const rows = await SellerApplication.find(filter)
      .sort({ createdAt: -1 })
      .populate('applicantId', 'name email userId role')
      .lean();

    const applications = rows.map((row) => ({
      _id: row._id,
      businessName: row.businessName,
      gstin: row.gstin,
      panNumber: row.panNumber,
      businessAddress: row.businessAddress,
      gstCertificateDataUrl: row.gstCertificateDataUrl,
      panCertificateDataUrl: row.panCertificateDataUrl,
      bankProofDataUrl: row.bankProofDataUrl,
      status: row.status,
      reviewNote: row.reviewNote,
      reviewedAt: row.reviewedAt,
      createdAt: row.createdAt,
      applicant: row.applicantId
        ? {
            _id: row.applicantId._id,
            name: row.applicantId.name,
            email: row.applicantId.email,
            userId: row.applicantId.userId,
            role: row.applicantId.role
          }
        : row.applicantEmail
          ? {
              _id: null,
              name: row.applicantName || '',
              email: row.applicantEmail,
              userId: '',
              role: 'seller'
            }
          : null
    }));

    res.json({
      success: true,
      data: { applications }
    });
  } catch (e) {
    console.error('listSellerApplications', e);
    res.status(500).json({ success: false, message: 'Failed to list applications' });
  }
};

/**
 * PATCH /api/admin/seller-applications/:id
 * body: { status: 'approved' | 'rejected', reviewNote?: string }
 */
exports.reviewSellerApplication = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const app = await SellerApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (app.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Application already reviewed' });
    }

    app.status = status;
    app.reviewNote = reviewNote ? String(reviewNote).slice(0, 2000) : '';
    app.reviewedBy = req.user.userId;
    app.reviewedAt = new Date();
    await app.save();

    /** @type {'none'|'sent'|'skipped_no_smtp'|'failed'} */
    let emailNotify = 'none';
    let temporaryPasswordForApprovalEmail = '';

    let sellerUser = app.applicantId ? await User.findById(app.applicantId) : null;

    // If seller account does not exist yet and admin approves, create it now.
    if (!sellerUser && status === 'approved') {
      const existingUser = await User.findOne({ email: app.applicantEmail?.toLowerCase() });
      if (existingUser) {
        sellerUser = existingUser;
      } else {
        const newUserId = `U${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const tempPassword = app.pendingPassword || generateTemporaryPassword();
        if (!app.pendingPassword) {
          temporaryPasswordForApprovalEmail = tempPassword;
        }
        sellerUser = await User.create({
          userId: newUserId,
          name: app.applicantName || 'Seller',
          email: (app.applicantEmail || '').toLowerCase(),
          password: tempPassword,
          role: 'seller',
          profile: {
            phone: app.applicantPhone || null
          },
          status: 'active',
          isVerified: true
        });
      }

      app.applicantId = sellerUser._id;
      app.pendingPassword = '';
      await app.save();
    }

    if (sellerUser) {
      if (status === 'approved') {
        sellerUser.role = 'seller';
        sellerUser.isVerified = true;
        sellerUser.status = 'active';
        await sellerUser.save();

        try {
          const r = await sendSellerApprovalEmail({
            to: sellerUser.email,
            name: sellerUser.name,
            userId: sellerUser.userId,
            loginEmail: sellerUser.email,
            temporaryPassword: temporaryPasswordForApprovalEmail || undefined
          });
          emailNotify = r?.skipped ? 'skipped_no_smtp' : r?.sent ? 'sent' : 'failed';
        } catch (emailErr) {
          console.error('Failed to send approval email', emailErr);
          emailNotify = 'failed';
        }
      } else {
        // Rejected: keep account unverified/inactive if it exists
        sellerUser.role = 'seller';
        sellerUser.isVerified = false;
        sellerUser.status = 'inactive';
        await sellerUser.save();

        try {
          const r = await sendSellerRejectionEmail({
            to: sellerUser.email,
            name: sellerUser.name,
            reviewNote: app.reviewNote,
            hasPlatformAccount: true
          });
          emailNotify = r?.skipped ? 'skipped_no_smtp' : r?.sent ? 'sent' : 'failed';
        } catch (emailErr) {
          console.error('Failed to send rejection email', emailErr);
          emailNotify = 'failed';
        }
      }
    } else if (status === 'rejected' && app.applicantEmail) {
      // No account exists (expected path). Still notify applicant via email.
      try {
        const r = await sendSellerRejectionEmail({
          to: app.applicantEmail,
          name: app.applicantName,
          reviewNote: app.reviewNote,
          hasPlatformAccount: false
        });
        emailNotify = r?.skipped ? 'skipped_no_smtp' : r?.sent ? 'sent' : 'failed';
      } catch (emailErr) {
        console.error('Failed to send rejection email', emailErr);
        emailNotify = 'failed';
      }
    }

    res.json({
      success: true,
      message: status === 'approved' ? 'Seller approved and role updated' : 'Application rejected',
      data: {
        application: {
          _id: app._id,
          status: app.status,
          reviewNote: app.reviewNote,
          reviewedAt: app.reviewedAt
        },
        emailNotify
      }
    });
  } catch (e) {
    console.error('reviewSellerApplication', e);
    res.status(500).json({ success: false, message: 'Failed to update application' });
  }
};

/**
 * GET /api/admin/financials
 * Lists both Withdrawals (bidders) and Payouts (sellers).
 */
exports.listFinancialRequests = async (req, res) => {
  try {
    const payouts = await Payout.find({ status: 'pending' })
      .populate('sellerUserId', 'name email userId')
      .lean();
      
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('userId', 'name email userId')
      .lean();
      
    // Unify them into a single list
    const combined = [
      ...payouts.map(p => ({
        _id: p._id,
        type: 'payout',
        amount: p.amount,
        status: p.status,
        requestedAt: p.initiatedAt || p.createdAt,
        user: p.sellerUserId,
        bankDetails: 'Resolved via Seller KYC Account Data', // Payouts usually use standard seller bank
        referenceId: p.razorpayPayoutId
      })),
      ...withdrawals.map(w => ({
        _id: w._id,
        type: 'withdrawal',
        amount: w.amount,
        status: w.status,
        requestedAt: w.requestedAt || w.createdAt,
        user: w.userId,
        bankDetails: w.bankDetails,
        referenceId: w._id
      }))
    ].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.status(200).json({
      success: true,
      data: { requests: combined }
    });
  } catch (error) {
    console.error('listFinancialRequests Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch financial requests.' });
  }
};

/**
 * PATCH /api/admin/financials/:id/:type
 * Processes a payout or withdrawal (accept/reject)
 */
exports.processFinancialRequest = async (req, res) => {
  try {
    const { id, type } = req.params;
    const { status, adminNote } = req.body; // status: 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (type === 'withdrawal') {
      const w = await Withdrawal.findById(id);
      if (!w) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
      if (w.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

      if (status === 'rejected') {
        // Refund wallet
        await User.findByIdAndUpdate(w.userId, { $inc: { walletBalance: w.amount } });
        w.status = 'rejected';
      } else {
        w.status = 'processed';
      }
      w.adminNote = adminNote || '';
      w.processedAt = new Date();
      await w.save();
      
    } else if (type === 'payout') {
      const p = await Payout.findById(id);
      if (!p) return res.status(404).json({ success: false, message: 'Payout not found' });
      if (p.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed' });

      if (status === 'rejected') {
        p.status = 'rejected';
      } else {
        p.status = 'processed'; // or settled
        p.settledAt = new Date();
      }
      // Payout schema doesn't have an explicit adminNote initially, we'll just save status.
      // (Optionally add it to model if needed, but saving it directly works if strict mode is off or if added)
      await p.save();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }

    res.status(200).json({
      success: true,
      message: `Successfully ${status} the ${type}.`
    });

  } catch (error) {
    console.error('processFinancialRequest Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};

/**
 * GET /api/admin/metrics
 * Fetch system metrics including platform commission
 */
exports.getMetrics = async (req, res) => {
  try {
    const Auction = require('../models/Auction');
    
    // Core Metrics
    const usersCount = await User.countDocuments();
    const liveAuctionsCount = await Auction.countDocuments({ status: 'live' });
    const activeSellers = await User.countDocuments({ role: 'seller', status: 'active' });
    
    // Revenue calculations
    const closedAuctions = await Auction.find({ status: 'closed' }).select('commissionEarned currentBid endsAt');
    const totalCommission = closedAuctions.reduce((sum, a) => sum + (a.commissionEarned || 0), 0);
    const totalGMV = closedAuctions.reduce((sum, a) => sum + (a.currentBid || 0), 0);
    const avgOrderValue = closedAuctions.length > 0 ? (totalGMV / closedAuctions.length) : 0;
    
    // Build timeline — supports ?days=5,7,14,30 (default 5)
    const days = Math.min(parseInt(req.query.days) || 5, 30);
    const timeline = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      
      const dayAuctions = closedAuctions.filter(a => {
        const d = new Date(a.endsAt);
        return d >= targetDate && d < nextDay;
      });
      const dayGMV = dayAuctions.reduce((sum, a) => sum + (a.currentBid || 0), 0);
      const dateLabel = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      
      timeline.push({
        name: dateLabel,
        revenue: dayGMV
      });
    }

    const adminUser = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        usersCount,
        liveAuctionsCount,
        totalCommission,
        totalGMV,
        avgOrderValue,
        activeSellers,
        timeline,
        adminWalletBalance: adminUser ? adminUser.walletBalance : 0
      }
    });
  } catch (e) {
    console.error('getMetrics Error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
};

/**
 * POST /api/admin/withdraw
 * Allows an admin to withdraw funds from their wallet.
 */
exports.adminWithdraw = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;
    const admin = await User.findById(req.user._id);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    if (admin.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    if (!bankDetails) {
      return res.status(400).json({ success: false, message: 'Bank details are required' });
    }

    // Deduct from admin wallet
    admin.walletBalance -= amount;
    await admin.save();

    // Create withdrawal record
    await Withdrawal.create({
      userId: admin._id,
      amount,
      bankDetails,
      status: 'processed', // Admin withdrawals are auto-processed (simulated)
      processedAt: new Date(),
      adminNote: 'Admin self-withdrawal'
    });

    res.json({
      success: true,
      message: `Withdrawal of ₹${amount} successful.`,
      data: { newBalance: admin.walletBalance }
    });

  } catch (e) {
    console.error('adminWithdraw Error:', e);
    res.status(500).json({ success: false, message: 'Withdrawal failed' });
  }
};

