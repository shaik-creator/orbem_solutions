const express = require('express');
const { events } = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', events);
router.get('/events', events);

module.exports = router;
