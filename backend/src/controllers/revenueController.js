const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertRequired, assertNonNegative, assertIn, assertDate, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');
const socketHelper = require('../config/socket');
const { calculatePaymentStatus } = require('../utils/paymentCalculator');

const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid', 'Overdue'];

const listRevenue = asyncHandler(async (req, res) => {
  const params = [];
  const where = [];

  if (req.query.payment_status) {
    where.push('p.payment_status = ?');
    params.push(req.query.payment_status);
  }
  if (req.query.q) {
    where.push('(b.booking_id LIKE ? OR b.customer_name LIKE ? OR p.invoice_number LIKE ?)');
    const val = `%${req.query.q}%`;
    params.push(val, val, val);
  }
  if (req.query.customer_id) {
    where.push('p.customer_id = ?');
    params.push(req.query.customer_id);
  }

  const rows = await query(
    `SELECT p.*, b.booking_id, b.customer_name, b.origin_airport, b.destination_airport,
            c.customer_name AS customer_full_name
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN customers c ON c.id = p.customer_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY p.due_date ASC, p.id DESC`,
    params
  );

  res.json({ revenue: rows });
});

const getRevenue = asyncHandler(async (req, res) => {
  const revenues = await query(
    `SELECT p.*, b.booking_id, b.customer_name, b.origin_airport, b.destination_airport,
            c.customer_name AS customer_full_name
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN customers c ON c.id = p.customer_id
     WHERE p.id = ? OR p.invoice_number = ?
     LIMIT 1`,
    [req.params.id, req.params.id]
  );

  if (!revenues.length) {
    throw createHttpError('Revenue record not found.', 404);
  }

  res.json({ revenue: revenues[0] });
});

const createRevenue = asyncHandler(async (req, res) => {
  const { booking_id, customer_id, invoice_number, amount, paid_amount, payment_status, due_date } = req.body;
  assertRequired(req.body, ['invoice_number', 'amount']);
  assertNonNegative(req.body, ['amount', 'paid_amount']);

  if (booking_id) {
    const bookings = await query('SELECT id FROM bookings WHERE id = ? LIMIT 1', [booking_id]);
    if (!bookings.length) {
      throw createHttpError('Booking not found.', 404);
    }

    const existingBookingPayment = await query('SELECT id FROM payments WHERE booking_id = ? LIMIT 1', [booking_id]);
    if (existingBookingPayment.length) {
      throw createHttpError('Revenue record already exists for this booking.', 409);
    }
  }


  // Check invoice uniqueness
  const existing = await query('SELECT id FROM payments WHERE invoice_number = ? LIMIT 1', [invoice_number]);
  if (existing.length) {
    throw createHttpError('Invoice number already exists.', 409);
  }

  const { balanceAmount, paymentStatus, paidAt } = calculatePaymentStatus(amount, paid_amount, due_date);

  const result = await query(
    `INSERT INTO payments (booking_id, customer_id, invoice_number, invoice_amount, paid_amount, 
     balance_amount, payment_status, due_date, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [booking_id || null, customer_id || null, invoice_number, Number(amount || 0), Number(paid_amount || 0), balanceAmount, paymentStatus, due_date || null, paidAt]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Revenue',
    title: `Revenue record created: ${invoice_number}`,
    description: `Amount: ₹${Number(amount || 0)}`,
    relatedType: 'payment',
    relatedId: result.insertId
  });

  const rows = await query('SELECT * FROM payments WHERE id = ? LIMIT 1', [result.insertId]);

  socketHelper.emit('payments:update', { id: result.insertId, action: 'create', booking_id });
  socketHelper.emit('dashboard:update', { type: 'payments' });

  res.status(201).json({
    message: 'Revenue record created successfully.',
    revenue: rows[0]
  });
});

const updateRevenue = asyncHandler(async (req, res) => {
  const { paid_amount, payment_date, payment_method, due_date } = req.body;

  const revenues = await query('SELECT * FROM payments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!revenues.length) {
    throw createHttpError('Revenue record not found.', 404);
  }

  const current = revenues[0];
  const invoiceAmt = Number(current.invoice_amount || 0);
  const paidAmt = paid_amount !== undefined ? Number(paid_amount) : Number(current.paid_amount || 0);
  const dDate = due_date || current.due_date;

  const { balanceAmount, paymentStatus, paidAt } = calculatePaymentStatus(invoiceAmt, paidAmt, dDate);

  await query(
    `UPDATE payments SET paid_amount = ?, balance_amount = ?, payment_status = ?, 
     payment_date = ?, payment_method = ?, due_date = ?, paid_at = ?
     WHERE id = ?`,
    [
      paidAmt,
      balanceAmount,
      paymentStatus,
      payment_date || current.payment_date,
      payment_method || current.payment_method,
      dDate,
      paidAt,
      req.params.id
    ]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Revenue',
    title: `Payment updated to ${paymentStatus}`,
    description: `Amount paid: ₹${paidAmt}`,
    relatedType: 'payment',
    relatedId: req.params.id
  });

  const updated = await query('SELECT * FROM payments WHERE id = ? LIMIT 1', [req.params.id]);

  socketHelper.emit('payments:update', { id: req.params.id, action: 'update', booking_id: updated[0]?.booking_id });
  socketHelper.emit('dashboard:update', { type: 'payments' });

  res.json({ message: 'Revenue record updated successfully.', revenue: updated[0] });
});

const deleteRevenue = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM payments WHERE id = ?', [req.params.id]);

  if (!result.affectedRows) {
    throw createHttpError('Revenue record not found.', 404);
  }

  await logActivity({
    userId: req.user.id,
    actionType: 'Revenue',
    title: 'Revenue record deleted',
    relatedType: 'payment',
    relatedId: req.params.id
  });

  socketHelper.emit('payments:update', { id: req.params.id, action: 'delete' });
  socketHelper.emit('dashboard:update', { type: 'payments' });

  res.json({ message: 'Revenue record deleted successfully.' });
});

const revenueSummary = asyncHandler(async (req, res) => {
  const summary = await query(
    `SELECT
       COALESCE(SUM(invoice_amount), 0) AS total_invoiced,
       COALESCE(SUM(paid_amount), 0) AS total_paid,
       COALESCE(SUM(balance_amount), 0) AS total_pending,
       COUNT(CASE WHEN payment_status = 'Overdue' THEN 1 END) AS overdue_count,
       COUNT(*) AS total_records
     FROM payments`
  );

  res.json({ summary: summary[0] || { total_invoiced: 0, total_paid: 0, total_pending: 0, overdue_count: 0, total_records: 0 } });
});

module.exports = {
  listRevenue,
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  revenueSummary,
  PAYMENT_STATUSES
};
