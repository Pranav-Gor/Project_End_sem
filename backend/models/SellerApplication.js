const mongoose = require('mongoose');

/**
 * Seller onboarding / KYC — GST, PAN, optional extra proofs (base64 data URLs).
 */
const sellerApplicationSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    // Pre-account applicant details (account is created only on admin approval)
    applicantName: { type: String, default: '', trim: true },
    applicantEmail: { type: String, default: '', trim: true, lowercase: true, index: true },
    applicantPhone: { type: String, default: '', trim: true },
    pendingPassword: { type: String, default: '' },
    businessName: { type: String, required: true, trim: true },
    gstin: { type: String, required: true, trim: true, uppercase: true },
    panNumber: { type: String, required: true, trim: true, uppercase: true },
    businessAddress: { type: String, default: '' },
    gstCertificateDataUrl: { type: String, default: '' },
    panCertificateDataUrl: { type: String, default: '' },
    bankProofDataUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    reviewNote: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

sellerApplicationSchema.index({ applicantId: 1, status: 1 });
sellerApplicationSchema.index({ applicantEmail: 1, status: 1 });

module.exports = mongoose.model('SellerApplication', sellerApplicationSchema);
