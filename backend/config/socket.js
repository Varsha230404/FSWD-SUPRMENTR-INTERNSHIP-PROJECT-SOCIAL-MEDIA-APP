const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const { canChat } = require('../utils/chatPermissions');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL || true
        : 'http://localhost:5173',
      credentials: true,
    },
  });

  const online = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name username');
      if (!user) return next(new Error('User not found'));

      socket.userId = String(user._id);
      socket.user = { _id: user._id, name: user.name, username: user.username };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    socket.join(`user:${uid}`);

    if (!online.has(uid)) {
      online.set(uid, new Set());
      io.emit('presence:online', { userId: uid });
    }
    online.get(uid).add(socket.id);

    socket.emit('presence:list', { online: Array.from(online.keys()) });

    socket.on('message:send', async (payload, ack) => {
      try {
        const to = String(payload?.to || '');
        const text = String(payload?.text || '').trim();
        if (!to) return ack?.({ ok: false, error: 'Recipient is required' });
        if (!text) return ack?.({ ok: false, error: 'Message text is required' });
        if (text.length > 2000)
          return ack?.({ ok: false, error: 'Message too long (max 2000 chars)' });

        const allowed = await canChat(uid, to);
        if (!allowed) {
          return ack?.({
            ok: false,
            error: 'You can only chat with people who follow you back.',
          });
        }

        const conversationId = Message.conversationIdFor(uid, to);
        const doc = await Message.create({
          from: uid,
          to,
          conversationId,
          text,
        });
        const message = doc.toObject();

        io.to(`user:${to}`).emit('message:new', message);
        io.to(`user:${uid}`).emit('message:new', message);
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: err.message || 'Failed to send' });
      }
    });

    socket.on('typing:start', async ({ to } = {}) => {
      if (!to) return;
      const allowed = await canChat(uid, to);
      if (!allowed) return;
      io.to(`user:${to}`).emit('typing:start', { from: uid });
    });

    socket.on('typing:stop', async ({ to } = {}) => {
      if (!to) return;
      io.to(`user:${to}`).emit('typing:stop', { from: uid });
    });

    socket.on('disconnect', () => {
      const set = online.get(uid);
      if (!set) return;
      set.delete(socket.id);
      if (set.size === 0) {
        online.delete(uid);
        io.emit('presence:offline', { userId: uid });
      }
    });
  });

  return io;
}

module.exports = initSocket;
