const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  username: u.username,
  email: u.email,
  avatar: u.avatar,
  bio: u.bio,
  savedPosts: u.savedPosts || [],
});

exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedUsername = String(username || '').toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existing) {
      const field = existing.email === normalizedEmail ? 'email' : 'username';
      const message = field === 'email' ? 'Email already registered' : 'Username is taken';
      return res.status(409).json({ message, field, errors: { [field]: message } });
    }

    const user = await User.create({ name, username: normalizedUsername, email: normalizedEmail, password });
    const token = generateToken(user._id);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    if (error && error.code === 11000 && error.keyPattern) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' ? 'Email already registered' : 'Username is taken';
      return res.status(409).json({ message, field, errors: { [field]: message } });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const id = String(identifier || '').toLowerCase().trim();

    const user = await User.findOne({ $or: [{ email: id }, { username: id }] }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar');
    res.json(user);
  } catch (error) { next(error); }
};
