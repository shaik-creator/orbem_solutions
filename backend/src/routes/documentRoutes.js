const express = require('express');
const { listDocuments, getDocument, createDocument, getByBooking, updateDocument, updateStatus, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/', listDocuments);
router.post('/', upload.single('file'), createDocument);

router.get('/booking/:bookingId', getByBooking);
router.get('/:id', getDocument);
router.put('/:id', upload.single('file'), updateDocument);
router.put(
  '/:id/status',
  requireRoles('Admin / Owner', 'Documentation Executive', 'Operations Staff'),
  upload.single('file'),
  updateStatus
);
router.delete('/:id', deleteDocument);

module.exports = router;
