const express = require('express');
const {
  listRevenue,
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  revenueSummary
} = require('../controllers/revenueController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listRevenue);
router.get('/summary', revenueSummary);
router.post('/', createRevenue);

router.get('/:id', getRevenue);
router.put('/:id', updateRevenue);
router.delete('/:id', deleteRevenue);

module.exports = router;
