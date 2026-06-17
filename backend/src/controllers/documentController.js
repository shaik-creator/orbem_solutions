const { query, transaction } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  assertIn,
  assertRequired,
  createHttpError
} = require('../utils/validators');
const { logActivity } = require('../services/activityService');

async function ensureDocuments(bookingId) {
  await transaction(async (connection) => {
    for (const documentType of DOCUMENT_TYPES) {
      await connection.query(
        `INSERT IGNORE INTO documents (booking_id, document_type, status)
         VALUES (?, ?, 'Pending')`,
        [bookingId, documentType]
      );
    }
  });
}

const listDocuments = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];

  if (req.query.status) {
    where.push('d.status = ?');
    params.push(req.query.status);
  }

  if (req.query.q) {
    where.push('(b.booking_id LIKE ? OR b.customer_name LIKE ? OR b.company_name LIKE ? OR d.document_type LIKE ?)');
    const value = `%${req.query.q}%`;
    params.push(value, value, value, value);
  }

  const rows = await query(
    `SELECT d.*, b.booking_id AS booking_code, b.customer_name, b.company_name,
            b.shipment_status, b.expected_delivery_date
     FROM documents d
     JOIN bookings b ON b.id = d.booking_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY d.updated_at DESC, d.id DESC
     LIMIT 200`,
    params
  );

  res.json({ documents: rows });
});

const getByBooking = asyncHandler(async (req, res) => {
  const bookings = await query('SELECT id, booking_id, customer_name FROM bookings WHERE id = ? LIMIT 1', [
    req.params.bookingId
  ]);
  if (!bookings.length) throw createHttpError('Booking not found.', 404);

  await ensureDocuments(req.params.bookingId);
  const documents = await query('SELECT * FROM documents WHERE booking_id = ? ORDER BY document_type ASC', [
    req.params.bookingId
  ]);

  res.json({ booking: bookings[0], documents });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, file_name, file_url, remarks } = req.body;
  assertRequired(req.body, ['status']);
  assertIn(status, DOCUMENT_STATUSES, 'Document status');

  const result = await query(
    `UPDATE documents
     SET status = ?, file_name = COALESCE(?, file_name), file_url = COALESCE(?, file_url),
         remarks = ?, verified_by = CASE WHEN ? = 'Verified' THEN ? ELSE verified_by END
     WHERE id = ?`,
    [status, file_name || null, file_url || null, remarks || null, status, req.user.id, req.params.id]
  );
  if (!result.affectedRows) throw createHttpError('Document not found.', 404);

  const rows = await query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
  await logActivity({
    userId: req.user.id,
    actionType: 'Document',
    title: `Document ${status}`,
    description: rows[0]?.document_type || 'Document updated',
    relatedType: 'booking',
    relatedId: rows[0]?.booking_id
  });
  res.json({ message: 'Document updated successfully.', document: rows[0] });
});

module.exports = {
  listDocuments,
  getByBooking,
  updateStatus
};
