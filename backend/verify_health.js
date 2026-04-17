const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function verifyAll() {
  console.log('--- SYSTEM HEALTH CHECK ---');
  
  // 1. MongoDB Connection
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    const auctionCount = await mongoose.connection.collection('auctions').countDocuments();
    console.log(`ℹ️ Auctions in DB: ${auctionCount}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
  }

  // 2. Cloudinary Configuration
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const res = await cloudinary.api.ping();
    console.log('✅ Cloudinary API reachable');
  } catch (err) {
    console.error('❌ Cloudinary Sync Failed:', err.message);
  }

  // 3. API Endpoints (Health Check)
  try {
    const res = await axios.get(`${API_BASE}/health`);
    console.log(`✅ Backend Health Check passed: ${res.data.status || 'OK'}`);
  } catch (err) {
    console.error(`❌ Backend unreachable on ${API_BASE}/health. Is it running? (${err.message})`);
  }

  // 4. Upcoming Auctions Endpoint
  try {
    const res = await axios.get(`${API_BASE}/auctions/upcoming`);
    console.log(`✅ Upcoming Auctions API OK (${res.data.data.auctions.length} found)`);
  } catch (err) {
    if (err.response) {
      console.error(`❌ Upcoming Auctions API returned ${err.response.status}:`, err.response.data);
    } else {
      console.error('❌ Upcoming Auctions API Failed:', err.message);
    }
  }

  console.log('---------------------------');
}

verifyAll();
