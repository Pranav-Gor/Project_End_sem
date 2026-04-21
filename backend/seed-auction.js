const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Auction = require('./models/Auction');
const User = require('./models/User');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction');
    console.log('Connected to MongoDB');

    // Make sure we have a seller
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      seller = await User.create({
        name: 'Dummy Seller',
        email: 'seller@example.com',
        password: 'password123',
        role: 'seller',
        isVerified: true,
        status: 'active'
      });
      console.log('Created dummy seller');
    }

    const now = new Date();
    // Auction that is live and ends in 1 hour
    const endsAt = new Date(now.getTime() + 60 * 60 * 1000);

    const newAuctionId = parseInt(`${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 9000) + 1000}`);

    const auction = new Auction({
      auctionId: newAuctionId,
      title: 'Vintage Rolex Submariner',
      category: 'Watches',
      description: 'A beautiful vintage Rolex from 1985 in mint condition.',
      images: [
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ],
      startingBid: 500000,
      currentBid: 500000,
      minIncrement: 10000,
      startsAt: now,
      endsAt: endsAt,
      status: 'live',
      seller: {
        sellerUserId: seller._id,
        name: seller.name,
        rating: 5,
        reviews: 12,
        sales: 4,
        location: 'Mumbai, India',
        memberSince: '2023'
      },
      bids: [],
      watchers: 5,
      featured: true
    });

    await auction.save();
    console.log(`Seeded auction ID: ${newAuctionId}`);

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    process.exit(0);
  }
}

seed();
