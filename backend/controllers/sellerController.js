const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
const Auction = require('../models/Auction');
const { validationResult } = require('express-validator');
const { verifySellerGstAgainstProvider } = require('../utils/gstinVerify');
const { uploadBase64 } = require('../utils/cloudinary');

/**
 * POST /api/seller/applications
 * Seller submits/updates their KYC docs.
 */
exports.submitSellerApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { 
      businessName, gstin, panNumber, businessAddress, 
      gstCertificateDataUrl, panCertificateDataUrl, bankProofDataUrl 
    } = req.body;

    const normalizedGstin = String(gstin).toUpperCase();
    const normalizedPan = String(panNumber).toUpperCase();
    const normalizedBusinessName = String(businessName || '');

    const gst = await verifySellerGstAgainstProvider({
      gstin: normalizedGstin,
      panNumber: normalizedPan,
      businessName: normalizedBusinessName
    });
    if (!gst.ok) {
      return res.status(400).json({
        success: false,
        message: gst.message,
        code: gst.code
      });
    }

    let finalGstUrl = gstCertificateDataUrl;
    let finalPanUrl = panCertificateDataUrl;
    let finalBankUrl = bankProofDataUrl;

    // Save directly to local database as base64 strings as requested
    // No Cloudinary/Supabase CDN upload for KYC docs anymore
    // (Seller side auction images still use CDN via uploadRoutes)

    const payload = {
      applicantId: user._id,
      applicantName: user.name,
      applicantEmail: user.email,
      applicantPhone: user.profile?.phone || '',

      businessName: normalizedBusinessName,
      gstin: normalizedGstin,
      panNumber: normalizedPan,
      businessAddress: businessAddress ? String(businessAddress) : '',

      gstCertificateDataUrl: finalGstUrl,
      panCertificateDataUrl: finalPanUrl,
      bankProofDataUrl: finalBankUrl,

      status: 'pending',
      reviewNote: '',
      reviewedAt: null,
      reviewedBy: null
    };

    // Upsert pending application for this seller.
    const existing = await SellerApplication.findOne({ applicantId: userId, status: 'pending' });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
    } else {
      await SellerApplication.create(payload);
    }

    res.status(201).json({ success: true, message: 'Seller application submitted' });
  } catch (e) {
    console.error('submitSellerApplication', e);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

/**
 * GET /api/seller/applications/me
 */
exports.getMySellerApplication = async (req, res) => {
  try {
    const userId = req.user.userId;

    const app = await SellerApplication.findOne({ applicantId: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        application: app || null
      }
    });
  } catch (e) {
    console.error('getMySellerApplication', e);
    res.status(500).json({ success: false, message: 'Failed to load application' });
  }
};

/**
 * GET /api/seller/auctions
 * Fetch all auctions created by the authenticated seller.
 * Includes total earnings stats.
 */
exports.getMyAuctions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const auctions = await Auction.find({ 'seller.sellerUserId': userId }).sort({ createdAt: -1 }).lean();

    // Stats
    const totalAuctions = auctions.length;
    const totalEarnings = auctions
      .filter(a => a.status === 'closed')
      .reduce((sum, a) => sum + (a.currentBid || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        auctions,
        stats: {
          totalAuctions,
          totalEarnings
        }
      }
    });
  } catch (e) {
    console.error('getMyAuctions Error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch your auctions' });
  }
};

/**
 * POST /api/seller/auctions
 * Seller creates a new auction.
 * Logic:
 * - No startsAt: Duration = 2 hours, Start = Now, Status = live.
 * - startsAt: Duration = 7 days, Start = startsAt, Status = upcoming/live.
 */
exports.createAuction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // KYC gate
    const app = await SellerApplication.findOne({ applicantId: userId, status: 'approved' });
    if (!app && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'KYC_REQUIRED',
        message: 'Your seller KYC application must be approved first.'
      });
    }

    const {
      title, category, description, images,
      startingBid, minIncrement, startsAt: rawStartsAt, durationDays: rawDurationDays,
      condition, shipping, returns,
    } = req.body;

    const now = new Date();
    // startsAt might be an empty string if "Start Now" is intended
    const startsAt = (rawStartsAt && rawStartsAt.trim()) ? rawStartsAt : null;
    let auctionStart = startsAt ? new Date(startsAt) : now;
    
    // Validation: startsAt must be >= now with a small grace period for timezone leeway
    if (startsAt && auctionStart < new Date(now.getTime() - 24 * 60 * 60 * 1000)) { // 1 day buffer to avoid UTC overlap issues temporarily blocking valid 'today' times
      return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
    }

    // Duration rule
    let parsedDurationDays = parseInt(rawDurationDays, 10);
    if (isNaN(parsedDurationDays) || parsedDurationDays < 1) {
      parsedDurationDays = 1;
    }
    if (parsedDurationDays > 3) {
      return res.status(400).json({ success: false, message: 'Duration cannot exceed 3 days' });
    }

    let durationMs = parsedDurationDays * 24 * 60 * 60 * 1000;
    
    const auctionEnd = new Date(auctionStart.getTime() + durationMs);
    const status = auctionStart > now ? 'upcoming' : 'live';

    // Generate unique numeric auctionId (Timestamp + random 4 digits)
    const newAuctionId = parseInt(`${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 9000) + 1000}`);

    const newAuction = new Auction({
      auctionId: newAuctionId,
      title,
      category,
      description,
      images: Array.isArray(images) ? images : [],
      startingBid: Number(startingBid),
      currentBid: Number(startingBid),
      minIncrement: Number(minIncrement) || 100,
      startsAt: auctionStart,
      endsAt: auctionEnd,
      status,
      seller: {
        sellerUserId: userId,
        name: app ? app.businessName : user.name,
        rating: 5,
        reviews: 0,
        sales: 0,
        location: app ? app.businessAddress : 'India',
        memberSince: user.createdAt.getFullYear().toString(),
      },
      condition,
      shipping,
      returns,
    });

    await newAuction.save();

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: {
        auctionId: newAuction.auctionId,
        status,
        endsAt: auctionEnd,
      }
    });
  } catch (e) {
    console.error('createAuction Error:', e);
    res.status(500).json({ success: false, message: 'Failed to create auction' });
  }
};
