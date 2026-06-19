const express = require('express');
const { uploadFile, listEntityUploads } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(protect);
router.post('/', upload.single('file'), uploadFile);
router.get('/:entityType/:entityId', listEntityUploads);

module.exports = router;
