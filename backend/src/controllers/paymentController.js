const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { PAYMENT_STATUSES, assertDate, assertNonNegative, assertIn, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');
const socketHelper = require('../config/socket');
const { calculatePaymentStatus } = require('../utils/paymentCalculator');

const listPayments = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.*, p.booking_id AS booking_db_id, b.booking_id AS booking_code,
            b.customer_name, b.company_name, b.origin_airport, b.destination_airport
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     ORDER BY p.due_date ASC, p.id DESC`
  );
  res.json({ payments: rows });
});

const revenueSummary = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT
       COALESCE(SUM(invoice_amount), 0) AS invoiced,
       COALESCE(SUM(paid_amount), 0) AS received,
       COALESCE(SUM(balance_amount), 0) AS pending,
       SUM(CASE WHEN payment_status = 'Overdue' THEN 1 ELSE 0 END) AS overdue_count,
       COUNT(*) AS payment_count
     FROM payments`
  );

  res.json({ summary: rows[0] || { invoiced: 0, received: 0, pending: 0, overdue_count: 0, payment_count: 0 } });
});

const updatePayment = asyncHandler(async (req, res) => {
  assertNonNegative(req.body, ['quotation_amount', 'invoice_amount', 'paid_amount']);
  assertDate(req.body.payment_date, 'Payment date');
  assertDate(req.body.due_date, 'Due date');

  const existing = await query('SELECT * FROM payments WHERE booking_id = ? LIMIT 1', [req.params.bookingId]);
  if (!existing.length) throw createHttpError('Payment record not found.', 404);

  const current = existing[0];
  const invoiceAmount = Number(req.body.invoice_amount ?? current.invoice_amount);
  const paidAmount = Number(req.body.paid_amount ?? current.paid_amount);
  const dueDate = req.body.due_date ?? current.due_date;

  const { balanceAmount, paymentStatus, paidAt } = calculatePaymentStatus(invoiceAmount, paidAmount, dueDate);

  await query(
    `UPDATE payments SET
      quotation_amount = ?, invoice_amount = ?, paid_amount = ?, balance_amount = ?,
      payment_status = ?, payment_date = ?, payment_method = ?, due_date = ?, paid_at = ?
     WHERE booking_id = ?`,
    [
      Number(req.body.quotation_amount ?? current.quotation_amount),
      invoiceAmount,
      paidAmount,
      balanceAmount,
      paymentStatus,
      req.body.payment_date ?? current.payment_date,
      req.body.payment_method ?? current.payment_method,
      dueDate,
      paidAt,
      req.params.bookingId
    ]
  );

  const rows = await query('SELECT * FROM payments WHERE booking_id = ?', [req.params.bookingId]);
  await logActivity({
    userId: req.user.id,
    actionType: 'Payment',
    title: 'Payment updated',
    description: `Status ${paymentStatus}, balance ${balanceAmount}`,
    relatedType: 'booking',
    relatedId: req.params.bookingId
  });

  socketHelper.emit('payments:update', { id: rows[0]?.id, action: 'update', booking_id: req.params.bookingId });
  socketHelper.emit('dashboard:update', { type: 'payments' });

  res.json({ message: 'Payment updated successfully.', payment: rows[0] });
});

module.exports = {
  listPayments,
  revenueSummary,
  updatePayment
};
