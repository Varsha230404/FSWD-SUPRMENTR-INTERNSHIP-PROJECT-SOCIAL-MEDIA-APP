const User = require('../models/User');

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name avatar username')
      .populate('following', 'name avatar username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { next(error); }
};

exports.getSavedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: [
        { path: 'user', select: 'name avatar username' },
        { path: 'commentCount' },
      ],
      options: { sort: { createdAt: -1 } },
    });
    res.json(user.savedPosts || []);
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.file) updates.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (error) { next(error); }
};

exports.followUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) return res.status(404).json({ message: 'User not found' });

    const isFollowing = req.user.following.includes(req.params.id);

    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
      res.json({ message: 'Unfollowed', following: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });

      const { createNotification } = require('../controllers/notificationController');
      createNotification({
        recipient: req.params.id,
        sender: req.user._id,
        type: 'follow',
      });

      res.json({ message: 'Followed', following: true });
    }
  } catch (error) { next(error); }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const me = req.user;
    const exclude = [me._id, ...(me.following || [])];
    const users = await User.find({ _id: { $nin: exclude } })
      .select('name avatar bio username')
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(users);
  } catch (error) { next(error); }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { username: { $regex: safe, $options: 'i' } },
      ],
    })
      .select('name avatar bio username')
      .limit(10);
    res.json(users);
  } catch (error) { next(error); }
};
