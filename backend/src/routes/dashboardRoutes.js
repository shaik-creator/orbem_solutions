const express = require('express');
const {
  summary,
  revenue,
  status,
  customerBusiness,
  delayedTrend,
  today
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/summary', summary);
router.get('/revenue', revenue);
router.get('/status', status);
router.get('/customer-business', customerBusiness);
router.get('/delayed-trend', delayedTrend);
router.get('/today', today);

module.exports = router;
