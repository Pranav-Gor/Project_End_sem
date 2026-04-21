const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');
const { verifySellerGstAgainstProvider } = require('../utils/gstinVerify');
const { generateTokenPair, verifyToken } = require('../utils/paseto');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendPasswordResetOtpEmail, isSmtpConfigured, sendRegistrationOtpEmail } = require('../utils/emailService');

const dashboardPathByRole = {
  user: '/dashboard',
  admin: '/admin/dashboard',
  seller: '/seller/dashboard'
};

function redirectToForRole(role) {
  return dashboardPathByRole[role] || '/dashboard';
}

/** Rejected / pre-verification sellers: send them to KYC instead of seller console. */
function postLoginRedirectForUser(user) {
  if (user.role === 'seller' && user.status === 'inactive' && user.isVerified === false) {
    return '/seller/kyc';
  }
  return redirectToForRole(user.role);
}

/** Fixed admin login (requested for local/demo). Remove or change before any public deployment. */
const HARDCODED_ADMIN_EMAIL = 'pranavgor7777@gmail.com';
const HARDCODED_ADMIN_PASSWORD = 'pranav';

function isHardcodedAdminLogin(email, password) {
  return (
    String(email).trim().toLowerCase() === HARDCODED_ADMIN_EMAIL &&
    password === HARDCODED_ADMIN_PASSWORD
  );
}

async function finalizeLogin(req, res, user) {
  await user.resetLoginAttempts();

  const { accessToken, refreshToken } = await generateTokenPair(user);

  if (!Array.isArray(user.refreshTokens)) {
    user.refreshTokens = [];
  }

  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'] || 'unknown'
  });

  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  const userResponse = {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    walletBalance: user.walletBalance ?? 0,
    profile: user.profile,
    lastLogin: user.lastLogin
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      redirectTo: postLoginRedirectForUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600
      }
    }
  });
}

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      password,
      phone,
      role: requestedRole,
      // Seller onboarding / KYC fields (base64 data URLs)
      businessName,
      gstin,
      panNumber,
      businessAddress,
      gstCertificateDataUrl,
      panCertificateDataUrl,
      bankProofDataUrl
    } = req.body;

    const role =
      requestedRole === 'seller' ? 'seller' : 'user';

    // For seller signup, do NOT create account now (unless re-applying after rejection).
    // Only collect application + docs in MongoDB for admin review.
    if (role === 'seller') {
      const emailKey = email.toLowerCase();

      const pendingRow = await SellerApplication.findOne({
        applicantEmail: emailKey,
        status: 'pending'
      });
      if (pendingRow) {
        return res.status(409).json({
          success: false,
          code: 'SELLER_APPLICATION_IN_PROGRESS',
          message: 'A seller application for this email is already in progress.'
        });
      }

      const existingUser = await User.findOne({ email: emailKey });
      if (existingUser) {
        const sellerMayReapplyAfterReject =
          existingUser.role === 'seller' &&
          existingUser.status === 'inactive' &&
          existingUser.isVerified === false;
        if (!sellerMayReapplyAfterReject) {
          return res.status(409).json({
            success: false,
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'User with this email already exists'
          });
        }
      }

      const missing = [];
      if (!businessName) missing.push('businessName');
      if (!gstin) missing.push('gstin');
      if (!panNumber) missing.push('panNumber');
      if (!gstCertificateDataUrl) missing.push('gstCertificateDataUrl');
      if (!panCertificateDataUrl) missing.push('panCertificateDataUrl');
      if (!bankProofDataUrl) missing.push('bankProofDataUrl');

      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: 'Seller KYC fields are required',
          missing
        });
      }

      // Real GST verification
      const gst = await verifySellerGstAgainstProvider({
        gstin: String(gstin).toUpperCase(),
        panNumber: String(panNumber).toUpperCase(),
        businessName: String(businessName).trim()
      });
      if (!gst.ok) {
        return res.status(400).json({
          success: false,
          message: gst.message,
          code: gst.code
        });
      }

      let applicationPayload = {
        applicantName: String(name).trim(),
        applicantEmail: emailKey,
        applicantPhone: phone || '',
        businessName: String(businessName).trim(),
        gstin: String(gstin).toUpperCase(),
        panNumber: String(panNumber).toUpperCase(),
        businessAddress: businessAddress ? String(businessAddress) : '',
        gstCertificateDataUrl,
        panCertificateDataUrl,
        bankProofDataUrl,
        status: 'pending',
        reviewNote: '',
        reviewedBy: null,
        reviewedAt: null,
        pendingPassword: password
      };

      if (existingUser?._id) {
        applicationPayload.applicantId = existingUser._id;
      }

      const previousApp = await SellerApplication.findOne({ applicantEmail: emailKey }).sort({
        updatedAt: -1
      });

      let savedApp;
      if (previousApp && ['rejected', 'approved'].includes(previousApp.status)) {
        Object.assign(previousApp, applicationPayload);
        savedApp = await previousApp.save();
      } else {
        savedApp = await SellerApplication.create(applicationPayload);
      }

      // Send response immediately
      res.status(201).json({
        success: true,
        message: 'Documents submitted. Admin will review and notify you by email.',
        data: {
          pendingReview: true,
          applicationId: savedApp._id
        }
      });

      // CRITICAL: Return here so we don't fall through to the buyer registration code below
      return;
    }

    // Check if buyer/user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      // If not verified, we can overwrite them
      await User.deleteOne({ _id: existingUser._id });
    }

    // Generate OTP
    const otp = String(crypto.randomInt(1000, 10000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Generate unique userId (format: U + timestamp + random)
    const userId = `U${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create buyer/user account immediately, but unverified
    const user = await User.create({
      userId,
      name,
      email: email.toLowerCase(),
      password,
      role,
      isVerified: false,
      registrationOtp: otpHash,
      registrationOtpExpires: new Date(Date.now() + 3 * 60 * 1000), // 3 mins
      profile: {
        phone: phone || null
      }
    });

    // Send OTP email
    try {
      await sendRegistrationOtpEmail({ to: user.email, name: user.name, otp });
    } catch (err) {
      console.error('Failed to send registration OTP:', err);
      // We continue, but realistically in prod we might want to fail
    }

    res.status(201).json({
      success: true,
      message: 'OTP sent to email. Please verify to complete registration.',
      data: {
        requiresOtp: true,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// In-memory rate limiting for OTP resend
const otpRateLimitMap = new Map();

/**
 * @desc    Resend Registration OTP
 * @route   POST /api/auth/resend-registration-otp
 * @access  Public
 */
const resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailNorm = String(email || '').trim().toLowerCase();

    if (!emailNorm) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Rate Limiting Logic: Max 3 requests per 5 minutes per email
    const now = Date.now();
    const rateLimitInfo = otpRateLimitMap.get(emailNorm) || { count: 0, firstRequest: now };

    if (now - rateLimitInfo.firstRequest > 5 * 60 * 1000) {
      rateLimitInfo.count = 0;
      rateLimitInfo.firstRequest = now;
    }

    if (rateLimitInfo.count >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 5 minutes.'
      });
    }

    rateLimitInfo.count += 1;
    otpRateLimitMap.set(emailNorm, rateLimitInfo);

    const user = await User.findOne({ email: emailNorm }).select('+registrationOtp +registrationOtpExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Generate new OTP
    const otp = String(crypto.randomInt(1000, 10000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.registrationOtp = otpHash;
    user.registrationOtpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 mins
    await user.save();

    // Send OTP email
    try {
      await sendRegistrationOtpEmail({ to: user.email, name: user.name, otp });
    } catch (err) {
      console.error('Failed to send registration OTP:', err);
      return res.status(500).json({ success: false, message: 'Failed to send email' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully to your email.'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Verify Registration OTP
 * @route   POST /api/auth/verify-registration
 * @access  Public
 */
const verifyRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailNorm = String(email || '').toLowerCase();
    const otpStr = String(otp || '').trim();

    if (!emailNorm || !otpStr) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: emailNorm }).select('+registrationOtp +registrationOtpExpires +password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    if (!user.registrationOtp || !user.registrationOtpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid OTP request' });
    }

    if (user.registrationOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please register again.' });
    }

    const incomingHash = crypto.createHash('sha256').update(otpStr).digest('hex');
    if (incomingHash !== user.registrationOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark as verified
    user.isVerified = true;
    user.registrationOtp = null;
    user.registrationOtpExpires = null;

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair(user);

    if (!Array.isArray(user.refreshTokens)) {
      user.refreshTokens = [];
    }

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      device: req.headers['user-agent'] || 'unknown'
    });
    await user.save();

    // Remove sensitive data from response
    const userResponse = {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      walletBalance: user.walletBalance ?? 0,
      profile: user.profile,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Registration verified successfully',
      data: {
        user: userResponse,
        redirectTo: redirectToForRole(user.role),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600
        }
      }
    });
  } catch (error) {
    console.error('Verify registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const emailNorm = email.toLowerCase();

    if (isHardcodedAdminLogin(email, password)) {
      let user = await User.findOne({ email: emailNorm }).select('+password');
      if (!user) {
        user = new User({
          userId: `UADMIN${Date.now()}`,
          name: 'Administrator',
          email: emailNorm,
          password: HARDCODED_ADMIN_PASSWORD,
          role: 'admin',
          status: 'active',
          isVerified: true
        });
        await user.save();
      } else {
        user.role = 'admin';
        user.status = 'active';
        user.isVerified = true;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.password = HARDCODED_ADMIN_PASSWORD;
        await user.save();
      }
      const fresh = await User.findById(user._id).select('+password');
      return await finalizeLogin(req, res, fresh);
    }

    // Find user with password (need to select it explicitly)
    const user = await User.findOne({ email: emailNorm }).select('+password');

    if (!user) {
      // Check if this is a pending seller application
      const pendingApp = await SellerApplication.findOne({ applicantEmail: emailNorm, status: 'pending' });
      if (pendingApp) {
        return res.status(403).json({
          success: false,
          code: 'APPLICATION_PENDING',
          message: 'Your documents are under review. We will get back to you within 24 hours.'
        });
      }

      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this email. Sign up to create one.'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60); // minutes
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTime} minutes.`
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();

      const remainingAttempts = 5 - user.failedLoginAttempts - 1;

      return res.status(401).json({
        success: false,
        message: remainingAttempts > 0
          ? `Invalid email or password. ${remainingAttempts} attempts remaining.`
          : 'Invalid email or password. Account will be locked after this attempt.'
      });
    }

    const inactiveSellerMaySignIn =
      user.role === 'seller' && user.status === 'inactive' && user.isVerified === false;

    if (user.status !== 'active' && !inactiveSellerMaySignIn) {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    return await finalizeLogin(req, res, user);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const forgotPasswordRequestOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!isSmtpConfigured()) {
      return res.status(503).json({
        success: false,
        code: 'SMTP_NOT_CONFIGURED',
        message:
          'Email is not configured. Add SMTP_USER and SMTP_PASS to backend/.env (copy from backend/.env.example), save the file, and restart the API server.'
      });
    }

    const emailNorm = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email: emailNorm }).select('+resetOtpHash +resetOtpExpiresAt');

    // Avoid account enumeration: always return generic success.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, an OTP has been sent.'
      });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetOtpHash = otpHash;
    user.resetOtpExpiresAt = new Date(Date.now() + 3 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save();

    try {
      const mail = await sendPasswordResetOtpEmail({
        to: user.email,
        name: user.name,
        otp
      });

      if (mail?.skipped) {
        user.resetOtpHash = null;
        user.resetOtpExpiresAt = null;
        await user.save();
        return res.status(500).json({
          success: false,
          message: 'Email service is not configured. Please set SMTP_USER and SMTP_PASS in backend/.env.'
        });
      }
    } catch (mailErr) {
      user.resetOtpHash = null;
      user.resetOtpExpiresAt = null;
      await user.save();

      const code = mailErr?.code;
      const responseCode = mailErr?.responseCode;
      if (code === 'EAUTH' || responseCode === 535) {
        console.error('forgotPasswordRequestOtp SMTP auth failed:', mailErr?.message);
        return res.status(502).json({
          success: false,
          code: 'SMTP_AUTH_FAILED',
          message:
            'Gmail rejected SMTP login (535). Use SMTP_USER = your full Gmail address and SMTP_PASS = a 16-character App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal Gmail password. Ensure 2-Step Verification is on.'
        });
      }
      console.error('forgotPasswordRequestOtp mail error:', mailErr);
      return res.status(502).json({
        success: false,
        code: 'SMTP_SEND_FAILED',
        message: 'Could not send email. Check SMTP settings in backend/.env and try again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If this email is registered, an OTP has been sent.'
    });
  } catch (error) {
    console.error('forgotPasswordRequestOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request'
    });
  }
};

const forgotPasswordConfirmOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const emailNorm = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');

    const user = await User.findOne({ email: emailNorm }).select('+password +resetOtpHash +resetOtpExpiresAt');
    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
      user.resetOtpHash = null;
      user.resetOtpExpiresAt = null;
      user.resetOtpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    if ((user.resetOtpAttempts || 0) >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect OTP attempts. Please request a new OTP.'
      });
    }

    const incomingHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (incomingHash !== user.resetOtpHash) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    user.resetOtpAttempts = 0;
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('forgotPasswordConfirmOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (requires valid refresh token)
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = await verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Find user and check if refresh token exists in their record
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if refresh token is in user's valid tokens
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    // Generate new token pair
    const tokens = await generateTokenPair(user);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      device: req.headers['user-agent'] || 'unknown'
    });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 3600
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (user) {
      // Remove specific refresh token or all tokens
      if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      } else {
        // Logout from all devices
        user.refreshTokens = [];
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          walletBalance: user.walletBalance ?? 0,
          profile: user.profile,
          status: user.status,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name !== undefined && name !== null && String(name).trim() !== '') {
      user.name = String(name).trim();
    }
    if (phone !== undefined) {
      user.profile.phone = phone ? String(phone).trim() : null;
    }
    if (avatar !== undefined) {
      user.profile.avatar = avatar && String(avatar).trim() !== '' ? String(avatar) : null;
    }
    if (address && typeof address === 'object') {
      user.profile.address = { ...user.profile.address, ...address };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance ?? 0,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
};

module.exports = {
  register,
  verifyRegistration,
  login,
  forgotPasswordRequestOtp,
  forgotPasswordConfirmOtp,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  resendRegistrationOtp
};
