/**
 * Create a platform admin user (for local dev).
 * Login: admin@auctus.io / Admin123!
 * Run: node scripts/seed-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction';
  await mongoose.connect(uri);

  const email = 'admin@auctus.io'.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    if (exists.role !== 'admin') {
      exists.role = 'admin';
      await exists.save();
      console.log('Updated existing user to admin:', email);
    } else {
      console.log('Admin already exists:', email);
    }
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  await User.create({
    userId: `UADMIN${Date.now()}`,
    name: 'Platform Admin',
    email,
    password: 'Admin123!',
    role: 'admin',
    status: 'active',
    profile: { phone: null, address: {}, avatar: null }
  });

  console.log('Created admin:', email, '/ password: Admin123!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
