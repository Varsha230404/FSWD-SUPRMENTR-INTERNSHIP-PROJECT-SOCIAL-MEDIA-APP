const Message = require('../models/Message');
const User = require('../models/User');
const { canChat, mutualFollowsOf } = require('../utils/chatPermissions');

exports.getContacts = async (req, res, next) => {
  try {
    const meId = String(req.user._id);
    const mutualIds = await mutualFollowsOf(meId);
    if (mutualIds.length === 0) return res.json([]);

    const users = await User.find({ _id: { $in: mutualIds } })
      .select('name username avatar')
      .lean();

    const enriched = await Promise.all(
      users.map(async (u) => {
        const conversationId = Message.conversationIdFor(meId, u._id);
        const [lastMessage, unread] = await Promise.all([
          Message.findOne({ conversationId }).sort({ createdAt: -1 }).lean(),
          Message.countDocuments({
            conversationId,
            to: meId,
            read: false,
          }),
        ]);
        return {
          user: u,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                from: lastMessage.from,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unread,
        };
      })
    );

    enriched.sort((a, b) => {
      const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (at !== bt) return bt - at;
      return a.user.name.localeCompare(b.user.name);
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const meId = String(req.user._id);
    const otherId = String(req.params.userId);

    const allowed = await canChat(meId, otherId);
    if (!allowed) {
      return res.status(403).json({
        message: 'You can only chat with people who follow you back.',
      });
    }

    const conversationId = Message.conversationIdFor(meId, otherId);
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    await Message.updateMany(
      { conversationId, to: meId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const meId = String(req.user._id);
    const otherId = String(req.params.userId);
    const text = String(req.body?.text || '').trim();

    if (!text) return res.status(400).json({ message: 'Message text is required' });
    if (text.length > 2000)
      return res.status(400).json({ message: 'Message is too long (max 2000 chars)' });

    const allowed = await canChat(meId, otherId);
    if (!allowed) {
      return res.status(403).json({
        message: 'You can only chat with people who follow you back.',
      });
    }

    const conversationId = Message.conversationIdFor(meId, otherId);
    const message = await Message.create({
      from: meId,
      to: otherId,
      conversationId,
      text,
    });

    const io = req.app.get('io');
    if (io) {
      const payload = message.toObject();
      io.to(`user:${otherId}`).emit('message:new', payload);
      io.to(`user:${meId}`).emit('message:new', payload);
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ to: req.user._id, read: false });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const meId = String(req.user._id);
    const otherId = String(req.params.userId);
    const conversationId = Message.conversationIdFor(meId, otherId);
    await Message.updateMany(
      { conversationId, to: meId, read: false },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
