/**
 * Seed pending seller KYC applications (needs at least one role=user in DB).
 * Run: node scripts/seed-seller-applications.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');

const IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction';
  await mongoose.connect(uri);

  const buyers = await User.find({ role: 'user' }).limit(3).lean();
  if (buyers.length === 0) {
    console.log('No buyer users found. Register a normal user first, then re-run.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const count = await SellerApplication.countDocuments({ status: 'pending' });
  if (count >= 2) {
    console.log('Pending applications already exist. Skip.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const samples = [
    {
      businessName: 'Heritage Collectibles LLP',
      gstin: '27AABCU9603R1ZX',
      panNumber: 'AABCU9603R',
      businessAddress: 'Fort, Mumbai, Maharashtra 400001'
    },
    {
      businessName: 'South India Antiques Pvt Ltd',
      gstin: '33AAAFI1234F1Z5',
      panNumber: 'AAAFI1234F',
      businessAddress: 'Mylapore, Chennai, Tamil Nadu 600004'
    }
  ];

  for (let i = 0; i < Math.min(samples.length, buyers.length); i++) {
    await SellerApplication.create({
      applicantId: buyers[i]._id,
      ...samples[i],
      gstCertificateDataUrl: IMG,
      panCertificateDataUrl: IMG,
      bankProofDataUrl: IMG,
      status: 'pending'
    });
  }

  console.log(`Inserted up to ${Math.min(samples.length, buyers.length)} pending seller applications.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
