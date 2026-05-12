const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({
      user: req.user._id,
      post: req.params.postId,
      text: req.body.text,
    });
    await comment.populate('user', 'name avatar username');

    const post = await Post.findById(req.params.postId);
    if (post) {
      const { createNotification } = require('../controllers/notificationController');
      createNotification({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: req.body.text.substring(0, 100),
      });
    }

    res.status(201).json(comment);
  } catch (error) { next(error); }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar');
    res.json(comments);
  } catch (error) { next(error); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) { next(error); }
};
