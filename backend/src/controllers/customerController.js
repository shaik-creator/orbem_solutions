const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertEmail, assertPhone, assertRequired, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

function validateCustomer(body, partial = false) {
  if (!partial) assertRequired(body, ['customer_name', 'company_name']);
  if (body.email) assertEmail(body.email);
  if (body.phone) assertPhone(body.phone);
}

const listCustomers = asyncHandler(async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.q) {
    where.push('(c.customer_name LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.city LIKE ?)');
    const value = `%${req.query.q}%`;
    params.push(value, value, value, value);
  }

  const rows = await query(
    `SELECT c.*,
            COUNT(DISTINCT b.id) AS booking_count,
            COALESCE(SUM(p.invoice_amount), 0) AS total_revenue,
            COALESCE(SUM(p.balance_amount), 0) AS pending_payments,
            MAX(b.booking_date) AS last_booking_date
     FROM customers c
     LEFT JOIN bookings b ON b.customer_id = c.id
     LEFT JOIN payments p ON p.booking_id = b.id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY c.id
     ORDER BY c.updated_at DESC, c.id DESC`,
    params
  );
  res.json({ customers: rows || [] });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customers = await query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS booking_count,
            (SELECT COALESCE(SUM(p.invoice_amount), 0)
             FROM bookings b
             JOIN payments p ON p.booking_id = b.id
             WHERE b.customer_id = c.id) AS total_revenue,
            (SELECT COALESCE(SUM(p.balance_amount), 0)
             FROM bookings b
             JOIN payments p ON p.booking_id = b.id
             WHERE b.customer_id = c.id) AS pending_payments,
            (SELECT COUNT(*)
             FROM bookings b
             JOIN documents d ON d.booking_id = b.id
             WHERE b.customer_id = c.id AND d.status IN ('Pending','Rejected')) AS pending_documents
     FROM customers c
     WHERE c.id = ?
     LIMIT 1`,
    [req.params.id]
  );
  if (!customers.length) throw createHttpError('Customer not found.', 404);

  const shipments = await query(
    `SELECT b.id, b.booking_id, b.origin_airport, b.destination_airport, b.shipment_status,
            b.booking_date, b.expected_delivery_date, b.priority, p.payment_status, p.balance_amount
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.customer_id = ?
     ORDER BY b.booking_date DESC, b.id DESC
     LIMIT 12`,
    [req.params.id]
  );

  const complaints = await query(
    `SELECT id, title, status, priority, created_at
     FROM complaints
     WHERE customer_name = ?
     ORDER BY created_at DESC
     LIMIT 8`,
    [customers[0].customer_name]
  );

  res.json({ customer: customers[0], shipments, complaints });
});

const createCustomer = asyncHandler(async (req, res) => {
  validateCustomer(req.body);
  const result = await query(
    'INSERT INTO customers (customer_name, company_name, email, phone, city) VALUES (?, ?, ?, ?, ?)',
    [
      req.body.customer_name.trim(),
      req.body.company_name.trim(),
      req.body.email || null,
      req.body.phone || null,
      req.body.city || null
    ]
  );
  await logActivity({
    userId: req.user.id,
    actionType: 'Customer',
    title: 'Customer created',
    description: `${req.body.customer_name} from ${req.body.company_name}`,
    relatedType: 'customer',
    relatedId: result.insertId
  });
  const rows = await query('SELECT * FROM customers WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ message: 'Customer created.', customer: rows[0] });
});

const updateCustomer = asyncHandler(async (req, res) => {
  validateCustomer(req.body, true);
  const existing = await query('SELECT * FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) throw createHttpError('Customer not found.', 404);

  const current = existing[0];
  await query(
    `UPDATE customers SET customer_name = ?, company_name = ?, email = ?, phone = ?, city = ?
     WHERE id = ?`,
    [
      req.body.customer_name ?? current.customer_name,
      req.body.company_name ?? current.company_name,
      req.body.email ?? current.email,
      req.body.phone ?? current.phone,
      req.body.city ?? current.city,
      req.params.id
    ]
  );
  await logActivity({
    userId: req.user.id,
    actionType: 'Customer',
    title: 'Customer updated',
    description: req.body.customer_name || current.customer_name,
    relatedType: 'customer',
    relatedId: req.params.id
  });
  const updated = await query('SELECT * FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ message: 'Customer updated.', customer: updated[0] });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM customers WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw createHttpError('Customer not found.', 404);
  await logActivity({
    userId: req.user.id,
    actionType: 'Customer',
    title: 'Customer deleted',
    relatedType: 'customer',
    relatedId: req.params.id
  });
  res.json({ message: 'Customer deleted.' });
});

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
