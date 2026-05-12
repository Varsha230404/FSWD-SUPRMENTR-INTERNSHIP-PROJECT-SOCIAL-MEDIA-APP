const router = require('express').Router();
const { getUser, updateProfile, followUser, searchUsers, getSuggestions, getSavedPosts } = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/search', auth, searchUsers);
router.get('/suggestions', auth, getSuggestions);
router.get('/saved-posts', auth, getSavedPosts);
router.put('/profile', auth, upload.single('avatar'), updateProfile);
router.get('/:id', auth, getUser);
router.put('/:id/follow', auth, followUser);

module.exports = router;
