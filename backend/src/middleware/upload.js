const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { createHttpError } = require('../utils/validators');

const uploadDir = path.join(__dirname, '../../uploads');
const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/octet-stream'
]);

fs.mkdirSync(uploadDir, { recursive: true });

function safeStoredName(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadDir);
  },
  filename(req, file, callback) {
    callback(null, safeStoredName(file));
  }
});

function fileFilter(req, file, callback) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExtensions.has(ext) || !allowedMimeTypes.has(file.mimetype)) {
    callback(createHttpError('Unsupported file type. Upload PDF, image, Office, Excel, or CSV files only.', 400));
    return;
  }
  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  upload,
  uploadDir
};
