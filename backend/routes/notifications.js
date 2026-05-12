const router = require('express').Router();
const {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markAsRead,
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/read-all', auth, markAllRead);
router.put('/:id/read', auth, markAsRead);

module.exports = router;
