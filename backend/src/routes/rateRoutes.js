const express = require('express');
const {
  listRates,
  createRate,
  updateRate,
  deleteRate,
  compareRates,
  importRates,
  exportRates
} = require('../controllers/rateController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/compare', compareRates);
router.get('/export.csv', exportRates);
router.post('/import', requireRoles('Admin / Owner', 'Partner Manager'), importRates);
router.route('/').get(listRates).post(requireRoles('Admin / Owner', 'Partner Manager'), createRate);
router
  .route('/:id')
  .put(requireRoles('Admin / Owner', 'Partner Manager'), updateRate)
  .delete(requireRoles('Admin / Owner'), deleteRate);

module.exports = router;
