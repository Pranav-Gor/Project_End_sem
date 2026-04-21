const Auction = require('./models/Auction');
const User = require('./models/User');
const { sendAuctionStartedEmail, sendAuctionWonEmailToWinner, sendAuctionSoldEmailToSeller } = require('./utils/emailService');

async function processAuctions() {
  const now = new Date();

  try {
    // 1. Process upcoming -> live
    const upcomingToLive = await Auction.find({ status: 'upcoming', startsAt: { $lte: now } });
    for (const auction of upcomingToLive) {
      auction.status = 'live';
      await auction.save();
      console.log(`[CRON] Auction ${auction.auctionId} is now live.`);

      // Notify watchers
      if (auction.watchersList && auction.watchersList.length > 0) {
        const users = await User.find({ _id: { $in: auction.watchersList } });
        for (const user of users) {
          try {
            await sendAuctionStartedEmail({
              to: user.email,
              auctionTitle: auction.title,
              auctionId: auction.auctionId
            });
          } catch (e) {
            console.error('Failed to send notify email to', user.email);
          }
        }
      }
    }

    // 2. Process live -> closed (time expired OR manually stopped)
    const liveToClosed = await Auction.find({
      $or: [
        { status: 'live', endsAt: { $lte: now } },
        { status: 'stoped' },
        { status: 'stopped' }
      ]
    });
    for (const auction of liveToClosed) {
      auction.status = 'closed';

      // 10% commission logic
      const finalBid = auction.currentBid || auction.startingBid || 0;
      if (finalBid > 0 && auction.bids && auction.bids.length > 0) {
        // Auction was won by someone
        const commission = finalBid * 0.10;
        const sellerCut = finalBid - commission;

        auction.commissionEarned = commission;

        // Add 90% to seller's wallet
        if (auction.seller && auction.seller.sellerUserId) {
          await User.findByIdAndUpdate(auction.seller.sellerUserId, {
            $inc: { walletBalance: sellerCut }
          });
        }
        const winnerBid = auction.bids[auction.bids.length - 1];
        auction.winner = winnerBid.bidderUserId;

        // Add 10% to admin's wallet
        try {
          await User.findOneAndUpdate(
            { role: 'admin' },
            { $inc: { walletBalance: commission } }
          );
          console.log(`[CRON] Commission of ₹${commission} credited to admin.`);
        } catch (adminErr) {
          console.error('[CRON] Failed to credit admin commission:', adminErr);
        }

        // Populate seller and winner for emails
        try {
          const winnerUser = await User.findById(winnerBid.bidderUserId);
          const sellerUser = await User.findById(auction.seller.sellerUserId);

          if (winnerUser && sellerUser) {
            // Format address
            let winnerAddr = 'Not provided';
            if (winnerUser.profile?.address) {
              const a = winnerUser.profile.address;
              winnerAddr = [a.street, a.city, a.state, a.zipCode, a.country].filter(Boolean).join(', ');
            }

            // Email to winner
            await sendAuctionWonEmailToWinner({
              to: winnerUser.email,
              winnerName: winnerUser.name,
              auctionTitle: auction.title,
              finalBid,
              sellerName: sellerUser.name,
              sellerEmail: sellerUser.email,
              sellerPhone: sellerUser.profile?.phone || ''
            });

            // Email to seller
            await sendAuctionSoldEmailToSeller({
              to: sellerUser.email,
              sellerName: sellerUser.name,
              auctionTitle: auction.title,
              finalBid,
              winnerName: winnerUser.name,
              winnerEmail: winnerUser.email,
              winnerPhone: winnerUser.profile?.phone || '',
              winnerAddress: winnerAddr
            });
            console.log(`[CRON] Sent win/sold emails for auction ${auction.auctionId}`);
          }
        } catch (emailErr) {
          console.error(`[CRON] Failed to send end emails for auction ${auction.auctionId}:`, emailErr);
        }

        console.log(`[CRON] Auction ${auction.auctionId} closed. Winner: ${winnerBid.bidderName}. Seller credited: ${sellerCut}. Commission: ${commission}.`);
      } else {
        console.log(`[CRON] Auction ${auction.auctionId} closed with no bids.`);
      }

      await auction.save();

      try {
        const { getIO } = require('./socket');
        getIO().to(`auction_${auction.auctionId}`).emit('auction_ended', {
          auctionId: auction.auctionId,
          finalBid: auction.currentBid
        });
      } catch (e) { }
    }

  } catch (error) {
    console.error('Error processing auctions cron:', error);
  }
}

function initCron() {
  // Run immediately on start, then every 5 seconds
  processAuctions();
  setInterval(processAuctions, 60 * 1000);
  console.log('Auction lifecycle cron initialized');
}

module.exports = { initCron, processAuctions };
