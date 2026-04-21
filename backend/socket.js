const { Server } = require('socket.io');

let io;

module.exports = {
  initSocket: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Client joins a specific auction room
      socket.on('join_auction', (auctionId) => {
        socket.join(`auction_${auctionId}`);
        console.log(`Socket ${socket.id} joined room: auction_${auctionId}`);
      });

      // Client leaves the room
      socket.on('leave_auction', (auctionId) => {
        socket.leave(`auction_${auctionId}`);
        console.log(`Socket ${socket.id} left room: auction_${auctionId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
