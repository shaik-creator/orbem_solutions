const express = require('express');
const { listNotifications, markRead, dismissNotification, assignTaskFromNotification, runAlerts } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listNotifications);
router.put('/:id/read', markRead);
router.put('/:id/dismiss', dismissNotification);
router.post('/:id/assign-task', assignTaskFromNotification);
router.post('/run-alert-check', requireRoles('Admin / Owner', 'Operations Staff'), runAlerts);

module.exports = router;
