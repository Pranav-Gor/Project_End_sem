const mongoose = require('mongoose');
const Auction = require('./models/Auction');
const dotenv = require('dotenv');

dotenv.config();

async function findRbAuctions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const auctions = await Auction.find({
      images: { $regex: /rb1/ }
    }).lean();
    console.log(`Found ${auctions.length} auctions matching rb1`);
    console.log(JSON.stringify(auctions, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findRbAuctions();
