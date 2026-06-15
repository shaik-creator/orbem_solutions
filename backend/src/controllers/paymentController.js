const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { PAYMENT_STATUSES, assertDate, assertNonNegative, assertIn, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

function resolvePaymentStatus({ invoice_amount, paid_amount, due_date, payment_status }) {
  if (payment_status) {
    assertIn(payment_status, PAYMENT_STATUSES, 'Payment status');
    return payment_status;
  }

  const invoice = Number(invoice_amount || 0);
  const paid = Number(paid_amount || 0);
  if (invoice > 0 && paid >= invoice) return 'Paid';
  if (due_date && new Date(due_date) < new Date() && invoice - paid > 0) return 'Overdue';
  if (paid > 0) return 'Partial';
  return 'Pending';
}

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

const updatePayment = asyncHandler(async (req, res) => {
  assertNonNegative(req.body, ['quotation_amount', 'invoice_amount', 'paid_amount']);
  assertDate(req.body.payment_date, 'Payment date');
  assertDate(req.body.due_date, 'Due date');

  const existing = await query('SELECT * FROM payments WHERE booking_id = ? LIMIT 1', [req.params.bookingId]);
  if (!existing.length) throw createHttpError('Payment record not found.', 404);

  const current = existing[0];
  const invoiceAmount = Number(req.body.invoice_amount ?? current.invoice_amount);
  const paidAmount = Number(req.body.paid_amount ?? current.paid_amount);
  const balanceAmount = Math.max(invoiceAmount - paidAmount, 0);
  const dueDate = req.body.due_date ?? current.due_date;
  const paymentStatus = resolvePaymentStatus({
    invoice_amount: invoiceAmount,
    paid_amount: paidAmount,
    due_date: dueDate,
    payment_status: req.body.payment_status
  });

  await query(
    `UPDATE payments SET
      quotation_amount = ?, invoice_amount = ?, paid_amount = ?, balance_amount = ?,
      payment_status = ?, payment_date = ?, payment_method = ?, due_date = ?
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
  res.json({ message: 'Payment updated successfully.', payment: rows[0] });
});

module.exports = {
  listPayments,
  updatePayment
};
