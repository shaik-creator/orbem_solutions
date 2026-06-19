const path = require('path');
const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertRequired, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

function publicFilePath(file) {
  return `/uploads/${path.basename(file.filename)}`;
}

async function saveUploadedFile({ file, body, userId }) {
  if (!file) {
    throw createHttpError('Please choose a file to upload.', 400);
  }

  assertRequired(body, ['module']);
  const entityId = body.entity_id ? Number(body.entity_id) : null;
  const result = await query(
    `INSERT INTO uploaded_files
      (module, entity_type, entity_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(body.module).trim(),
      body.entity_type ? String(body.entity_type).trim() : null,
      Number.isFinite(entityId) ? entityId : null,
      file.originalname,
      file.filename,
      publicFilePath(file),
      file.mimetype,
      file.size,
      userId || null
    ]
  );

  return {
    id: result.insertId,
    original_name: file.originalname,
    stored_name: file.filename,
    file_path: publicFilePath(file),
    mime_type: file.mimetype,
    file_size: file.size
  };
}

const uploadFile = asyncHandler(async (req, res) => {
  const uploaded = await saveUploadedFile({ file: req.file, body: req.body, userId: req.user.id });
  await logActivity({
    userId: req.user.id,
    actionType: 'Upload',
    title: `Uploaded ${uploaded.original_name}`,
    description: `${req.body.module}${req.body.entity_type ? ` / ${req.body.entity_type}` : ''}`,
    relatedType: req.body.entity_type || 'upload',
    relatedId: req.body.entity_id || uploaded.id
  });
  res.status(201).json(uploaded);
});

const listEntityUploads = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, module, entity_type, entity_id, original_name, stored_name, file_path, mime_type, file_size, created_at
     FROM uploaded_files
     WHERE entity_type = ? AND entity_id = ?
     ORDER BY created_at DESC, id DESC`,
    [req.params.entityType, req.params.entityId]
  );
  res.json({ files: rows });
});

module.exports = {
  saveUploadedFile,
  uploadFile,
  listEntityUploads
};
