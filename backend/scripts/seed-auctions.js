/**
 * Seed sample auctions using real external URLs (simulating Cloudinary/CDN).
 * Run: node scripts/seed-auctions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Auction = require('../models/Auction');

const MASTERPIECES = [
  {
    id: 1,
    title: 'Vintage Rolex Submariner 1967',
    category: 'Luxury Watches',
    images: [
      'https://images.unsplash.com/photo-1587836374828-4dbaba94cf0e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1622434641406-a15812345ad1?q=80&w=1000&auto=format&fit=crop'
    ],
    startingBid: 15000,
    currentBid: 28500,
    watchers: 156,
    featured: true,
    hot: true,
    desc: 'An exceptional vintage Rolex Submariner Reference 5513 from 1967. Professionally serviced; box and papers included.'
  },
  {
    id: 1002,
    title: '2025 Red Bull Racing RB21 Prototype',
    category: 'F1 Memorabilia',
    images: [
      'https://images.unsplash.com/photo-15494935ef6-039c0490b83e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1635073908681-7994644eb987?q=80&w=1000&auto=format&fit=crop'
    ],
    startingBid: 2500000,
    currentBid: 2500000,
    watchers: 890,
    featured: true,
    hot: true,
    desc: 'The engineering marvel that defines the next era of Formula 1. This prototype RB21 features the ultra-low-drag wing configuration used in wind tunnel testing.'
  },
  {
    id: 1003,
    title: 'Patek Philippe Grandmaster Chime',
    category: 'Luxury Watches',
    images: [
      'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1000&auto=format&fit=crop'
    ],
    startingBid: 3200000,
    currentBid: 3500000,
    watchers: 412,
    featured: true,
    hot: true,
    desc: 'The most complicated Patek Philippe wristwatch ever made, featuring 20 complications, a reversible case, and two independent dials.'
  },
  {
    id: 1004,
    title: 'NVIDIA H100 GPU Cluster (8-Node)',
    category: 'Enterprise Servers',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef0109b4952e?q=80&w=1000&auto=format&fit=crop'
    ],
    startingBid: 140000,
    currentBid: 155000,
    watchers: 234,
    featured: false,
    hot: true,
    desc: 'Power your LLM training with this ready-to-deploy cluster of 8 NVIDIA H100 GPUs. Includes high-speed InfiniBand networking.'
  }
];

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for seeding...');

  await Auction.deleteMany({});
  console.log('Cleared existing auctions.');

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const docs = MASTERPIECES.map((m, idx) => ({
    auctionId: m.id,
    title: m.title,
    category: m.category,
    description: m.desc,
    images: m.images,
    startingBid: m.startingBid,
    currentBid: m.currentBid,
    minIncrement: 500,
    bidCount: idx === 0 ? 42 : 0,
    status: idx === 2 ? 'upcoming' : 'live', // Patek is upcoming
    startsAt: idx === 2 ? new Date(now.getTime() + 2 * day) : now,
    endsAt: new Date(now.getTime() + (idx + 3) * day),
    seller: {
      name: 'Auctus Curated',
      rating: 5.0,
      reviews: 1200,
      sales: 450,
      location: 'Dubai, UAE',
      memberSince: '2024'
    },
    bids: idx === 0 ? [
      { bidderName: 'EliteCollector', amount: 28500, timeLabel: '10 min ago' },
      { bidderName: 'TimeLord', amount: 28000, timeLabel: '15 min ago' }
    ] : [],
    watchers: m.watchers,
    featured: m.featured,
    hot: m.hot,
    specifications: [
      { label: 'Condition', value: 'Mint / Museum Grade' },
      { label: 'Provenance', value: 'Certified' }
    ],
    condition: 'Mint',
    authenticity: 'Verified by Auctus',
    shipping: 'Insured Global Express',
    returns: '30-day money-back guarantee'
  }));

  await Auction.insertMany(docs);
  console.log(`Successfully seeded ${docs.length} auctions with high-quality images.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
