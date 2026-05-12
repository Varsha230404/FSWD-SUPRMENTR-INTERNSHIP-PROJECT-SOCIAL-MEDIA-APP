const router = require('express').Router();
const { deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.delete('/:id', auth, deleteComment);

module.exports = router;
