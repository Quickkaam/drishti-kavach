// ============================================
// Drishti Kavach — WebSocket (Socket.io)
// Real-time dashboard updates
// ============================================

const jwt = require('jsonwebtoken');

function initSocketIO(io) {
  // Auth middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Connected: user ${socket.userId} (${socket.userRole})`);

    // Join admin room if admin/analyst
    if (['admin', 'analyst'].includes(socket.userRole)) {
      socket.join('admin');
    }

    // Join website-specific room
    socket.on('join_website', (websiteId) => {
      socket.join(`website:${websiteId}`);
      console.log(`[WS] User ${socket.userId} joined website:${websiteId}`);
    });

    socket.on('leave_website', (websiteId) => {
      socket.leave(`website:${websiteId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Disconnected: user ${socket.userId}`);
    });
  });

  // Emit to all admins
  io.emitToAdmins = (event, data) => {
    io.to('admin').emit(event, data);
  };

  return io;
}

module.exports = { initSocketIO };
