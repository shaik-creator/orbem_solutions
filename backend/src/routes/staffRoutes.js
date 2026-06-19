const express = require('express');
const { listStaff, createStaff, updateStaff, deleteStaff, staffActivity } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/activity', staffActivity);
router.get('/', listStaff);
router.post('/', requireRoles('Admin / Owner'), createStaff);
router.put('/:id', requireRoles('Admin / Owner'), updateStaff);
router.delete('/:id', requireRoles('Admin / Owner'), deleteStaff);

module.exports = router;
