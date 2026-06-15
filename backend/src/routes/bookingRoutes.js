const express = require('express');
const {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  updateStatus,
  getTimeline,
  addTimelineEntry
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(listBookings).post(createBooking);
router
  .route('/:id')
  .get(getBooking)
  .put(updateBooking)
  .delete(requireRoles('Admin / Owner', 'Operations Staff'), deleteBooking);
router.route('/:id/timeline').get(getTimeline).post(addTimelineEntry);
router.put('/:id/status', updateStatus);

module.exports = router;
