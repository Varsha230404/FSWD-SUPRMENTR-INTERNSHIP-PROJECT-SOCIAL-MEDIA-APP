const router = require('express').Router();
const { body } = require('express-validator');
const { createPost, getFeed, getUserPosts, getPost, updatePost, deletePost, toggleLike, toggleSavePost } = require('../controllers/postController');
const { addComment, getComments } = require('../controllers/commentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

router.post('/', auth, upload.single('image'), [
  body('text').trim().notEmpty().withMessage('Post text is required'),
], validate, createPost);

router.get('/', auth, getFeed);
router.get('/user/:userId', auth, getUserPosts);
router.get('/:id', auth, getPost);
router.put('/:id', auth, upload.single('image'), updatePost);
router.delete('/:id', auth, deletePost);
router.put('/:id/like', auth, toggleLike);
router.put('/:id/save', auth, toggleSavePost);

router.post('/:postId/comments', auth, [
  body('text').trim().notEmpty().withMessage('Comment text is required'),
], validate, addComment);
router.get('/:postId/comments', auth, getComments);

module.exports = router;
