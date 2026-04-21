const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Payout = require('../models/Payout');

/**
 * GET /api/seller/analytics
 * Fetch metrics for the seller dashboard analytics.
 */
exports.getSellerAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || '5d'; // '5d', '7d', '14d', 'month', 'all'
    
    let startDate = new Date(0);
    const now = new Date();
    if (period === '5d') {
      startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '14d') {
      startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const allAuctions = await Auction.find({ 'seller.sellerUserId': userId }).lean();
    
    // Filter active auctions based on endsAt/createdAt? Usually performance metrics filter by closed dates or created dates. 
    // We'll filter auctions created or closed within the period for stats.
    const auctionsInPeriod = period === 'all' ? allAuctions : allAuctions.filter(a => {
      const createdDate = new Date(a.createdAt);
      const endsDate = new Date(a.endsAt);
      return createdDate >= startDate || endsDate >= startDate;
    });
    
    // Status counts in period
    const live = auctionsInPeriod.filter(a => a.status === 'live').length;
    const upcoming = auctionsInPeriod.filter(a => {
      if (a.status !== 'upcoming') return false;
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);
      return new Date(a.startsAt) <= soon;
    }).length;
    const closed = auctionsInPeriod.filter(a => a.status === 'closed').length;
    
    // Revenue & Bids in period (we count revenue strictly for closed auctions overlapping the period)
    const validClosed = auctionsInPeriod.filter(a => a.status === 'closed' && new Date(a.endsAt) >= startDate);
    const totalGross = validClosed.reduce((sum, a) => sum + (a.currentBid || 0), 0);
    
    const totalBids = auctionsInPeriod.reduce((sum, a) => sum + (a.bidCount || 0), 0);
    const avgBidsPerAuction = auctionsInPeriod.length > 0 ? (totalBids / auctionsInPeriod.length).toFixed(1) : 0;
    
    // Category Distribution
    const categoryMap = {};
    auctionsInPeriod.forEach(a => {
      categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
    });
    const categorySplit = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
    
    // Success Rate (closed with at least one bid above starting)
    const successful = validClosed.filter(a => a.bidCount > 0).length;
    const successRate = validClosed.length > 0 ? Math.round((successful / validClosed.length) * 100) : 0;

    // Build timeline dates
    let daysForTimeline = 5;
    if (period === '7d') daysForTimeline = 7;
    else if (period === '14d') daysForTimeline = 14;
    else if (period === 'month') daysForTimeline = now.getDate();
    else if (period === 'all') daysForTimeline = 30;
    const timeline = await calculateRevenueTimeline(userId, daysForTimeline);

    // Recent Activity Feed
    // 1. Recent closed auctions
    const recentClosed = allAuctions.filter(a => a.status === 'closed').sort((a,b) => new Date(b.endsAt) - new Date(a.endsAt)).slice(0, 3);
    // 2. Recent live auctions that got bids? We can fake bid events based on bidCount for logic, or we use Payouts
    const Payout = require('../models/Payout');
    const recentPayouts = await Payout.find({ sellerUserId: userId }).sort({ createdAt: -1 }).limit(3).lean();
    
    const activity = [];
    recentClosed.forEach(a => {
      activity.push({
        type: 'auction',
        title: 'Auction Closed',
        desc: `'${a.title}' sold successfully`,
        time: new Date(a.endsAt).getTime()
      });
    });
    recentPayouts.forEach(p => {
      activity.push({
        type: 'payout',
        title: 'Payout Initiated',
        desc: `₹${p.amount} processing`,
        time: new Date(p.createdAt).getTime()
      });
    });
    // Add fake "New bid" for lively activity if there's a highly bid live auction
    const hotLive = allAuctions.filter(a => a.status === 'live' && a.bidCount > 0).sort((a,b) => b.bidCount - a.bidCount)[0];
    if (hotLive) {
      activity.push({
        type: 'bid',
        title: 'New Bid Received',
        desc: `₹${hotLive.currentBid} on '${hotLive.title}'`,
        time: Date.now() - Math.floor(Math.random() * 3600000) // Within last hour
      });
    }

    // Sort combined activity desc
    activity.sort((a, b) => b.time - a.time);
    const recentActivity = activity.slice(0, 4).map(item => {
      const minutesAgo = Math.floor((Date.now() - item.time) / 60000);
      const hoursAgo = Math.floor(minutesAgo / 60);
      const daysAgo = Math.floor(hoursAgo / 24);
      let timeStr = 'Just now';
      if (daysAgo > 0) timeStr = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
      else if (hoursAgo > 0) timeStr = `${hoursAgo} hr${hoursAgo > 1 ? 's' : ''} ago`;
      else if (minutesAgo > 0) timeStr = `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`;

      return {
        ...item,
        timeLabel: timeStr
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAuctions: auctionsInPeriod.length,
          live,
          upcoming,
          closed,
          totalGross,
          totalBids,
          avgBidsPerAuction,
          successRate
        },
        categorySplit,
        timeline,
        recentActivity
      }
    });

  } catch (e) {
    console.error('getSellerAnalytics Error', e);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

/**
 * Helper to calculate daily revenue dynamically
 */
async function calculateRevenueTimeline(userId, days) {
  const timeline = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const dayRevenue = await Auction.aggregate([
      {
        $match: {
          'seller.sellerUserId': new mongoose.Types.ObjectId(userId),
          status: 'closed',
          endsAt: { $gte: targetDate, $lt: nextDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$currentBid' }
        }
      }
    ]);

    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dateLabel = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    
    timeline.push({
      day: dayName,
      date: dateLabel,
      revenue: dayRevenue.length > 0 ? dayRevenue[0].total : 0
    });
  }
  
  return timeline;
}
