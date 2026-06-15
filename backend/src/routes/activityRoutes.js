const express = require('express');
const { recentActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/recent', recentActivity);

module.exports = router;
