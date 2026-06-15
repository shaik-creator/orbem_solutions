const express = require('express');
const { getByBooking, updateStatus } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/booking/:bookingId', getByBooking);
router.put(
  '/:id/status',
  requireRoles('Admin / Owner', 'Documentation Executive', 'Operations Staff'),
  updateStatus
);

module.exports = router;
