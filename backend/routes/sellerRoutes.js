const express = require('express');
const { body } = require('express-validator');
const { protectAllowInactive, restrictTo } = require('../middleware/auth');
const { submitSellerApplication, getMySellerApplication, createAuction, getMyAuctions } = require('../controllers/sellerController');

const router = express.Router();

// Allow inactive sellers to upload documents (admin can later activate them)
router.use(protectAllowInactive);
router.use(restrictTo('seller', 'admin'));

// Seller submits/updates their KYC application
router.post(
  '/applications',
  [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('gstin')
      .trim()
      .notEmpty().withMessage('GSTIN is required')
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
      .withMessage('GSTIN format is invalid'),
    body('panNumber')
      .trim()
      .notEmpty().withMessage('PAN number is required')
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
      .withMessage('PAN must be in format ABCDE1234F'),
    body('businessAddress').optional().isString(),
    body('gstCertificateDataUrl').notEmpty().withMessage('GST certificate is required'),
    body('panCertificateDataUrl').notEmpty().withMessage('PAN certificate is required'),
    body('bankProofDataUrl').notEmpty().withMessage('Bank proof is required')
  ],
  submitSellerApplication
);

// Seller fetches current application status
router.get('/applications/me', getMySellerApplication);

// Seller fetches their own auctions & performance stats
router.get('/auctions', getMyAuctions);

// Seller creates a new auction
router.post(
  '/auctions',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('startingBid').isNumeric().withMessage('Starting bid must be a number')
  ],
  createAuction
);

module.exports = router;
