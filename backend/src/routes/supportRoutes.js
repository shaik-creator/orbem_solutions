const express = require('express');
const { createTicket, listTickets, updateTicketStatus } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.post('/tickets', createTicket);
router.get('/tickets', requireRoles('Admin / Owner'), listTickets);
router.put('/tickets/:id/status', requireRoles('Admin / Owner'), updateTicketStatus);

module.exports = router;
