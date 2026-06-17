const express = require('express');
const {
  bookingsCsv,
  revenueCsv,
  pendingDocumentsCsv,
  monthlySummary
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/bookings.csv', bookingsCsv);
router.get('/revenue.csv', revenueCsv);
router.get('/pending-documents.csv', pendingDocumentsCsv);
router.get('/summary', monthlySummary);
router.get('/monthly-summary', monthlySummary);

module.exports = router;
