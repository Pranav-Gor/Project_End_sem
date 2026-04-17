require('dotenv').config();
const mongoose = require('mongoose');
const { uploadBase64 } = require('../utils/cloudinary');

// Models
const User = require('../models/User');
const Auction = require('../models/Auction');
const SellerApplication = require('../models/SellerApplication');

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME_HERE') {
      console.error('ERROR: Please set CLOUDINARY_CLOUD_NAME in backend/.env before running this script.');
      process.exit(1);
    }

    console.log('Starting Migration: Users...');
    const users = await User.find({ 'profile.avatar': { $regex: /^data:image/ } });
    console.log(`Found ${users.length} users with Base64 avatars.`);
    for (const user of users) {
      console.log(`Uploading avatar for user ${user._id}...`);
      const url = await uploadBase64(user.profile.avatar, 'auctus/users');
      user.profile.avatar = url;
      await user.save();
    }

    console.log('Starting Migration: Seller Applications...');
    const sellerApps = await SellerApplication.find({
      $or: [
        { gstCertificateDataUrl: { $regex: /^data:image/ } },
        { panCertificateDataUrl: { $regex: /^data:image/ } },
        { bankProofDataUrl: { $regex: /^data:image/ } },
      ]
    });
    console.log(`Found ${sellerApps.length} seller applications with Base64 images.`);
    for (const app of sellerApps) {
      console.log(`Processing SellerApp ${app._id}...`);
      if (app.gstCertificateDataUrl && app.gstCertificateDataUrl.startsWith('data:image')) {
        app.gstCertificateDataUrl = await uploadBase64(app.gstCertificateDataUrl, 'auctus/sellers');
      }
      if (app.panCertificateDataUrl && app.panCertificateDataUrl.startsWith('data:image')) {
        app.panCertificateDataUrl = await uploadBase64(app.panCertificateDataUrl, 'auctus/sellers');
      }
      if (app.bankProofDataUrl && app.bankProofDataUrl.startsWith('data:image')) {
        app.bankProofDataUrl = await uploadBase64(app.bankProofDataUrl, 'auctus/sellers');
      }
      await app.save();
    }

    console.log('Starting Migration: Auctions...');
    const auctions = await Auction.find({}); // some elements in array might match, easier to iterate
    let auctionCount = 0;
    for (const auction of auctions) {
      if (!auction.images || auction.images.length === 0) continue;
      
      let changed = false;
      const newImages = [];
      for (const img of auction.images) {
        if (img.startsWith('data:image')) {
          console.log(`Uploading image for Auction ${auction.auctionId}...`);
          const url = await uploadBase64(img, 'auctus/auctions');
          newImages.push(url);
          changed = true;
        } else {
          newImages.push(img);
        }
      }
      
      if (changed) {
        auction.images = newImages;
        await auction.save();
        auctionCount++;
      }
    }
    console.log(`Migrated images for ${auctionCount} auctions.`);

    console.log('Migration Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
