/**
 * Set a user's password the same way the app does (Argon2 via User pre-save).
 * Use this after editing users in Compass — direct DB edits skip hashing and often break login.
 *
 * Usage (from backend folder):
 *   node scripts/set-user-password.js pranav@example.com "YourNewPassword"
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const password = process.argv[3];
  if (!email || !password) {
    console.error('Usage: node scripts/set-user-password.js <email> <new-password>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.error('No user found with email:', email);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = password;
  await user.save();
  console.log('Password updated (Argon2 hashed) for:', email);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
