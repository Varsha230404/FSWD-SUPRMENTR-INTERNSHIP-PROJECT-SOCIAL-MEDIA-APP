const Post = require('../models/Post');

exports.createPost = async (req, res, next) => {
  try {
    const postData = { user: req.user._id, text: req.body.text };
    if (req.file) postData.image = req.file.path;

    const post = await Post.create(postData);
    await post.populate('user', 'name avatar username');
    res.status(201).json(post);
  } catch (error) { next(error); }
};

exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar username')
        .populate('commentCount'),
      Post.countDocuments(),
    ]);

    res.json({ posts, page, pages: Math.ceil(total / limit), total });
  } catch (error) { next(error); }
};

exports.getUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar username')
      .populate('commentCount');
    res.json(posts);
  } catch (error) { next(error); }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name avatar username')
      .populate('commentCount');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) { next(error); }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.text) post.text = req.body.text;
    if (req.file) post.image = req.file.path;
    await post.save();
    await post.populate('user', 'name avatar username');
    res.json(post);
  } catch (error) { next(error); }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) { next(error); }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.addToSet(userId);

      const { createNotification } = require('../controllers/notificationController');
      createNotification({
        recipient: post.user,
        sender: userId,
        type: 'like',
        post: post._id,
      });
    }
    await post.save();
    res.json({ likes: post.likes, likesCount: post.likes.length });
  } catch (error) { next(error); }
};

exports.toggleSavePost = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.includes(req.params.id);

    if (isSaved) {
      user.savedPosts.pull(req.params.id);
    } else {
      user.savedPosts.addToSet(req.params.id);
    }
    await user.save();
    res.json({ saved: !isSaved, savedPosts: user.savedPosts });
  } catch (error) { next(error); }
};
