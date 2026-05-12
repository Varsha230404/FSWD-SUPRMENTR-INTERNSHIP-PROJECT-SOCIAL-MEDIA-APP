const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/chatController');

const router = express.Router();

router.use(auth);

router.get('/contacts', ctrl.getContacts);
router.get('/unread-count', ctrl.getUnreadCount);
router.get('/messages/:userId', ctrl.getMessages);
router.post('/messages/:userId', ctrl.sendMessage);
router.post('/messages/:userId/read', ctrl.markRead);

module.exports = router;
