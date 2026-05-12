const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  text: { type: String, required: [true, 'Comment text is required'], maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
