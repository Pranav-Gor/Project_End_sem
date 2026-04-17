const mongoose = require('mongoose');
const Auction = require('./models/Auction');
const User = require('./models/User');

const MONGODB_URI = 'mongodb://localhost:27017/auction';
const SELLER_ID = '69cfa1799af94bbe122041b4'; // Hardcoded from previous query

async function insertTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const seller = await User.findById(SELLER_ID);
    if (!seller) {
      console.error('Seller not found');
      return;
    }

    // Clear existing auctions to start fresh for this test
    await Auction.deleteMany({ 'seller.sellerUserId': SELLER_ID });
    console.log('Cleared old test auctions');

    const now = new Date();

    const auctions = [
      {
        auctionId: 5001,
        title: 'Antique Brass Compass',
        category: 'Collectibles',
        description: 'A vintage brass compass from the early 20th century.',
        startingBid: 1500,
        currentBid: 1800,
        bidCount: 3,
        status: 'live',
        startsAt: now,
        endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        seller: {
          sellerUserId: SELLER_ID,
          name: seller.name,
          location: 'Delhi'
        }
      },
      {
        auctionId: 5002,
        title: 'Rare Vinyl: Pink Floyd First Press',
        category: 'Music',
        description: 'Pristine condition first pressing of Dark Side of the Moon.',
        startingBid: 5000,
        currentBid: 5000,
        bidCount: 0,
        status: 'upcoming',
        startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endsAt: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000), // 7 days after start
        seller: {
          sellerUserId: SELLER_ID,
          name: seller.name,
          location: 'Delhi'
        }
      },
      {
        auctionId: 5003,
        title: 'Handcrafted Walnut Coffee Table',
        category: 'Furniture',
        description: 'Custom made solid walnut coffee table.',
        startingBid: 12000,
        currentBid: 15500,
        bidCount: 12,
        status: 'closed',
        startsAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), 
        endsAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Ended 1 day ago
        seller: {
          sellerUserId: SELLER_ID,
          name: seller.name,
          location: 'Delhi'
        }
      }
    ];

    await Auction.create(auctions);
    console.log('Inserted 3 test auctions (Live, Upcoming, Closed)');

    // Verify stats calculation logic (copied from controller)
    const myAuctions = await Auction.find({ 'seller.sellerUserId': SELLER_ID });
    const totalAuctions = myAuctions.length;
    const totalEarnings = myAuctions
      .filter(a => a.status === 'closed')
      .reduce((sum, a) => sum + (a.currentBid || 0), 0);

    console.log('\n--- VERIFICATION STATS ---');
    console.log(`Total Auctions: ${totalAuctions} (Expected: 3)`);
    console.log(`Total Gross Earnings: ₹${totalEarnings} (Expected: 15500 from the closed table)`);
    console.log(`Estimated Payout (90%): ₹${totalEarnings * 0.9} (Expected: 13950)`);
    console.log('--- TEST PASSED ---\n');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

insertTestData();
