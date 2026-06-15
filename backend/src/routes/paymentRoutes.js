const express = require('express');
const { listPayments, updatePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listPayments);
router.put('/:bookingId', requireRoles('Admin / Owner', 'Accounts Staff', 'Operations Staff'), updatePayment);

module.exports = router;
