const express = require('express');
const {
  listAlerts,
  getUnreadCount,
  markAsRead,
  checkAlerts,
  deleteAlert
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listAlerts);
router.get('/unread-count', getUnreadCount);
router.post('/check', checkAlerts);

router.put('/:id/read', markAsRead);
router.delete('/:id', deleteAlert);

module.exports = router;
