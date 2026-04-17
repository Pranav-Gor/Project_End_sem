const mongoose = require('mongoose');
const User = require('./models/User');
const Auction = require('./models/Auction');
const SellerApplication = require('./models/SellerApplication');

const MONGODB_URI = 'mongodb://localhost:27017/auction';

const categories = ['Fine Art', 'Luxury Watches', 'Classic Cars', 'Electronics', 'Collectibles', 'Furniture'];
const images = [
  'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800',
];

async function populate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const sellers = await User.find({ role: 'seller' });
    if (sellers.length === 0) {
      console.log('No sellers found to populate. Please register some sellers first.');
      process.exit(0);
    }

    console.log(`Found ${sellers.length} sellers. Cleaning up and populating...`);

    // Clean up old auctions for these sellers to prevent duplicates or cluttered dashboards
    const sellerIds = sellers.map(s => s._id);
    await Auction.deleteMany({ 'seller.sellerUserId': { $in: sellerIds } });
    console.log('Cleared existing auctions for all sellers.');

    const now = new Date();
    let globalAuctionCounter = 10001; // Start from a fresh base

    for (const seller of sellers) {
      console.log(`Populating data for seller: ${seller.name}`);

      // 1. Ensure approved application
      let app = await SellerApplication.findOne({ applicantId: seller._id });
      if (!app) {
        app = await SellerApplication.create({
          applicantId: seller._id,
          businessName: `${seller.name}'s Premium Store`,
          gstin: '27AAAAA0000A1Z5',
          panNumber: 'ABCDE1234F',
          status: 'approved',
          businessAddress: `${100 + Math.floor(Math.random() * 900)} Luxury Ave, Mumbai`,
          gstCertificateDataUrl: 'mock_url',
          panCertificateDataUrl: 'mock_url',
          bankProofDataUrl: 'mock_url',
        });
      } else if (app.status !== 'approved') {
        app.status = 'approved';
        await app.save();
      }

      const auctionDocs = [];

      // 2. Generate 14 days of history (Area Chart data)
      for (let i = 0; i < 14; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        targetDate.setHours(14, 0, 0, 0);

        const baseBid = 10000 + Math.floor(Math.random() * 50000);
        const winBid = baseBid + Math.floor(Math.random() * 15000);
        const cat = categories[Math.floor(Math.random() * categories.length)];

        auctionDocs.push({
          auctionId: globalAuctionCounter++,
          title: `Sold: Premium ${cat} Lot`,
          category: cat,
          description: 'A high-value item sold to a verified bidder. Full provenance included.',
          images: [images[Math.floor(Math.random() * images.length)]],
          startingBid: baseBid,
          currentBid: winBid,
          bidCount: 5 + Math.floor(Math.random() * 20),
          status: 'closed',
          startsAt: new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          endsAt: targetDate,
          seller: {
            sellerUserId: seller._id,
            name: app.businessName,
            location: app.businessAddress,
            rating: 4.8,
            reviews: 42,
            sales: 15,
            memberSince: 'Jan 2024'
          },
          condition: 'Excellent',
          shipping: 'Express Insured',
          returns: 'None',
          bids: [
            { bidderName: 'John Doe', amount: winBid, timeLabel: '2 mins ago' }
          ]
        });
      }

      // 3. Generate 5 Live Auctions
      for (let i = 0; i < 5; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const baseBid = 5000 + Math.floor(Math.random() * 20000);

        auctionDocs.push({
          auctionId: globalAuctionCounter++,
          title: `LIVE: ${cat} Special Edition`,
          category: cat,
          description: 'Bidding is currently open for this exceptional piece. Real-time updates active.',
          images: [images[Math.floor(Math.random() * images.length)]],
          startingBid: baseBid,
          currentBid: baseBid + (Math.floor(Math.random() * 2000)),
          bidCount: Math.floor(Math.random() * 10),
          status: 'live',
          startsAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          endsAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          seller: {
            sellerUserId: seller._id,
            name: app.businessName,
            location: app.businessAddress,
          },
          bids: []
        });
      }

      // 4. Generate 3 Upcoming Auctions
      for (let i = 0; i < 3; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        auctionDocs.push({
          auctionId: globalAuctionCounter++,
          title: `UPCOMING: High-Value ${cat}`,
          category: cat,
          description: 'Save to your watchlist. This auction begins soon.',
          images: [images[Math.floor(Math.random() * images.length)]],
          startingBid: 25000,
          currentBid: 25000,
          bidCount: 0,
          status: 'upcoming',
          startsAt: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          endsAt: new Date(now.getTime() + (i + 8) * 24 * 60 * 60 * 1000),
          seller: {
            sellerUserId: seller._id,
            name: app.businessName,
            location: app.businessAddress,
          }
        });
      }

      await Auction.insertMany(auctionDocs);
      console.log(`Successfully populated all data states for ${seller.name}`);
    }

    console.log('\n--- SUCCESS ---');
    console.log('Database is now fully functional for all dashboards.');
    console.log('Every seller has 14 days of history, 5 live lots, and 3 upcoming lots.');
    process.exit(0);
  } catch (err) {
    console.error('Population Failed:', err);
    process.exit(1);
  }
}

populate();
