const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('role')
    .optional()
    .isIn(['user', 'seller']).withMessage('Invalid role'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage('Please enter a valid phone number'),
  body('panNumber')
    .if(body('role').equals('seller'))
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/).withMessage('PAN must be in format ABCDE1234F'),
  body('gstin')
    .if(body('role').equals('seller'))
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
    .withMessage('GSTIN format is invalid')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const forgotPasswordRequestValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
];

const forgotPasswordConfirmValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('otp')
    .trim()
    .matches(/^\d{4}$/).withMessage('OTP must be a 4-digit code'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 24 }).withMessage('Phone is too long'),
  body('avatar')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500000 }).withMessage('Avatar payload is too large'),
  body('address').optional().isObject(),
  body('address.street').optional().trim().isLength({ max: 300 }),
  body('address.city').optional().trim().isLength({ max: 100 }),
  body('address.state').optional().trim().isLength({ max: 100 }),
  body('address.zipCode').optional().trim().isLength({ max: 20 }),
  body('address.country').optional().trim().isLength({ max: 100 })
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/verify-registration', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').matches(/^\d{4}$/).withMessage('OTP must be a 4-digit code')
], verifyRegistration);
router.post('/resend-registration-otp', [
  body('email').isEmail().withMessage('Valid email is required')
], resendRegistrationOtp);
router.post('/login', loginValidation, login);
router.post('/forgot-password/request', forgotPasswordRequestValidation, forgotPasswordRequestOtp);
router.post('/forgot-password/confirm', forgotPasswordConfirmValidation, forgotPasswordConfirmOtp);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);

module.exports = router;
