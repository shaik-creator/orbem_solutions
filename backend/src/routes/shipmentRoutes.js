const express = require('express');
const {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  addTimelineEntry,
  deleteShipment
} = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', listShipments);
router.post('/', createShipment);

router.get('/:id', getShipment);
router.put('/:id', updateShipment);
router.delete('/:id', deleteShipment);

router.put('/:id/status', updateShipmentStatus);
router.post('/:id/timeline', addTimelineEntry);

module.exports = router;
