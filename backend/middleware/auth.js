const { verifyToken } = require('../utils/paseto');
const User = require('../models/User');

/** Rejected seller (inactive, unverified) may still call protected APIs e.g. KYC. */
function inactiveUnverifiedSeller(user) {
  return (
    user.role === 'seller' &&
    user.status === 'inactive' &&
    user.isVerified === false
  );
}

/**
 * Middleware to protect routes - verifies PASETO token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (optional - for cookie-based auth)
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = await verifyToken(token);

      // Check if it's an access token
      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type. Please login again.'
        });
      }

      // Check if user still exists
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }

      if (user.status !== 'active' && !inactiveUnverifiedSeller(user)) {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact support.'
        });
      }

      // Check if user changed password after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Password recently changed. Please login again.'
        });
      }

      // Attach user info to request object
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      next();

    } catch (error) {
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please refresh your token or login again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

/**
 * Optional authentication middleware - doesn't require auth but attaches user if token is valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = await verifyToken(token);
      
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId);
        if (user && (user.status === 'active' || inactiveUnverifiedSeller(user))) {
          req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            name: user.name
          };
        }
      }
    } catch (error) {
      // Invalid token, continue as unauthenticated
      req.user = null;
    }

    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Same as `protect` but DOES NOT block inactive users.
 * Used for seller KYC flows so a seller can upload documents before admin approval.
 */
const protectAllowInactive = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      const decoded = await verifyToken(token);
      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type. Please login again.'
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }

      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      next();
    } catch (error) {
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please refresh your token or login again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth,
  protectAllowInactive
};
