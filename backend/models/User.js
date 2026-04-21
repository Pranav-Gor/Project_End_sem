const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'seller'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  registrationOtp: {
    type: String,
    default: null,
    select: false
  },
  registrationOtpExpires: {
    type: Date,
    default: null,
    select: false
  },
  /** Available balance for bidding (whole INR, same unit as auction bids). */
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  profile: {
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    avatar: {
      type: String,
      default: null
    }
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  resetOtpHash: {
    type: String,
    default: null,
    select: false
  },
  resetOtpExpiresAt: {
    type: Date,
    default: null,
    select: false
  },
  resetOtpAttempts: {
    type: Number,
    default: 0
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    device: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password: Argon2 hashes (new users) or legacy plain text (existing Compass data)
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const stored = this.password;
    if (!stored || candidatePassword === undefined || candidatePassword === null) return false;
    if (typeof stored === 'string' && stored.startsWith('$argon2')) {
      return await argon2.verify(stored, candidatePassword);
    }
    // Legacy: Compass / imports often store plain text or numeric passwords — coerce for comparison.
    return String(stored) === String(candidatePassword);
  } catch (error) {
    return false;
  }
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: {
      failedLoginAttempts: 0,
      lastLogin: new Date()
    },
    $unset: { lockUntil: 1 }
  });
};

// Check if password was changed after token was issued (iat is ISO string from PASETO v4)
userSchema.methods.changedPasswordAfter = function(iatClaim) {
  if (!this.passwordChangedAt) return false;
  let issuedSec =
    typeof iatClaim === 'string'
      ? Math.floor(new Date(iatClaim).getTime() / 1000)
      : typeof iatClaim === 'number'
        ? iatClaim
        : NaN;
  if (Number.isNaN(issuedSec)) return false;
  const changedSec = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return issuedSec < changedSec;
};

// Virtual for user's auctions
userSchema.virtual('auctions', {
  ref: 'Auction',
  localField: '_id',
  foreignField: 'sellerId'
});

// Virtual for user's bids
userSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'bidderId'
});

module.exports = mongoose.model('User', userSchema);
