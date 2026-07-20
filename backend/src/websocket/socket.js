// ============================================
// Drishti Kavach — WebSocket (Socket.io)
// Real-time dashboard updates and notifications
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

    // Join user-specific room for personal notifications
    socket.join(`user:${socket.userId}`);

    // Join admin room if admin/analyst
    if (['admin', 'superadmin', 'analyst'].includes(socket.userRole)) {
      socket.join('admin');
    }

    // Join superadmin room
    if (socket.userRole === 'superadmin') {
      socket.join('superadmin');
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

  // Emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Emit notification to user
  io.emitNotification = (userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
  };

  // Emit notification to role
  io.emitToRole = (role, event, data) => {
    // Find all sockets with this role and emit
    const sockets = io.sockets.sockets;
    for (const socket of sockets.values()) {
      if (socket.userRole === role) {
        socket.emit(event, data);
      }
    }
  };

  return io;
}

module.exports = { initSocketIO };
