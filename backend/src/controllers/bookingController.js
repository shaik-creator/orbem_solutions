const { query, transaction } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { calculateChargeableWeight } = require('../utils/chargeableWeight');
const {
  BOOKING_STATUSES,
  DOCUMENT_TYPES,
  PRIORITIES,
  assertRequired,
  assertEmail,
  assertPhone,
  assertNonNegative,
  assertIn,
  assertDate,
  cleanAirport,
  createHttpError
} = require('../utils/validators');
const { logActivity } = require('../services/activityService');
const socketHelper = require('../config/socket');

const BOOKING_FIELDS = [
  'customer_name',
  'customer_email',
  'customer_phone',
  'company_name',
  'origin_airport',
  'destination_airport',
  'pickup_city',
  'delivery_city',
  'cargo_type',
  'cargo_description',
  'package_count',
  'actual_weight',
  'length_cm',
  'width_cm',
  'height_cm',
  'shipment_status',
  'booking_date',
  'expected_delivery_date',
  'actual_delivery_date',
  'assigned_owner_id',
  'priority',
  'notes',
  'awb_number'
];

function validateBookingPayload(body, partial = false) {
  if (!partial) {
    assertRequired(body, [
      'customer_name',
      'customer_email',
      'customer_phone',
      'company_name',
      'origin_airport',
      'destination_airport',
      'pickup_city',
      'delivery_city',
      'cargo_type',
      'package_count',
      'actual_weight',
      'length_cm',
      'width_cm',
      'height_cm',
      'booking_date',
      'expected_delivery_date'
    ]);
  }

  if (body.customer_email) assertEmail(body.customer_email, 'Customer email');
  if (body.customer_phone) assertPhone(body.customer_phone, 'Customer phone');
  assertNonNegative(body, ['package_count', 'actual_weight', 'length_cm', 'width_cm', 'height_cm']);
  if (body.package_count !== undefined && Number(body.package_count) < 1) {
    throw createHttpError('Package count must be at least 1.');
  }
  if (body.shipment_status) assertIn(body.shipment_status, BOOKING_STATUSES, 'Shipment status');
  if (body.priority) assertIn(body.priority, PRIORITIES, 'Priority');
  assertDate(body.booking_date, 'Booking date');
  assertDate(body.expected_delivery_date, 'Expected delivery date');
  assertDate(body.actual_delivery_date, 'Actual delivery date');

  if (body.booking_date && body.expected_delivery_date && new Date(body.expected_delivery_date) < new Date(body.booking_date)) {
    throw createHttpError('Expected delivery date cannot be before booking date.');
  }
}

function normalizeBooking(body, existing = {}) {
  const payload = { ...existing };
  for (const field of BOOKING_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }

  payload.origin_airport = cleanAirport(payload.origin_airport);
  payload.destination_airport = cleanAirport(payload.destination_airport);
  payload.package_count = Number(payload.package_count || 1);
  payload.actual_weight = Number(payload.actual_weight || 0);
  payload.length_cm = Number(payload.length_cm || 0);
  payload.width_cm = Number(payload.width_cm || 0);
  payload.height_cm = Number(payload.height_cm || 0);
  payload.shipment_status = payload.shipment_status || 'Booked';
  payload.priority = payload.priority || 'Normal';
  payload.assigned_owner_id = payload.assigned_owner_id || null;
  payload.actual_delivery_date = payload.actual_delivery_date || null;
  payload.awb_number = payload.awb_number || null;

  const weights = calculateChargeableWeight(payload);
  payload.volumetric_weight = weights.volumetric_weight;
  payload.chargeable_weight = weights.chargeable_weight;
  return payload;
}

async function generateBookingId(connection) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS count FROM bookings WHERE YEAR(booking_date) = YEAR(CURDATE())"
  );
  const next = Number(rows[0].count || 0) + 1;
  return `ORB-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`;
}

async function findOrCreateCustomer(connection, payload) {
  const [existing] = await connection.query(
    'SELECT id FROM customers WHERE email = ? OR (company_name = ? AND customer_name = ?) LIMIT 1',
    [payload.customer_email, payload.company_name, payload.customer_name]
  );
  if (existing.length) return existing[0].id;

  const [result] = await connection.query(
    'INSERT INTO customers (customer_name, company_name, email, phone, city) VALUES (?, ?, ?, ?, ?)',
    [payload.customer_name, payload.company_name, payload.customer_email, payload.customer_phone, payload.pickup_city]
  );
  return result.insertId;
}

async function ensureDefaultDocuments(connection, bookingId) {
  for (const documentType of DOCUMENT_TYPES) {
    await connection.query(
      `INSERT IGNORE INTO documents (booking_id, document_type, status)
       VALUES (?, ?, 'Pending')`,
      [bookingId, documentType]
    );
  }
}

function resolveInitialPaymentStatus(invoiceAmount, paidAmount, dueDate) {
  if (invoiceAmount > 0 && paidAmount >= invoiceAmount) return 'Paid';
  if (dueDate && new Date(dueDate) < new Date() && invoiceAmount - paidAmount > 0) return 'Overdue';
  if (paidAmount > 0) return 'Partial';
  return 'Pending';
}

function buildListWhere(queryParams) {
  const where = [];
  const params = [];

  if (queryParams.q) {
    where.push('(b.booking_id LIKE ? OR b.customer_name LIKE ? OR b.company_name LIKE ? OR b.cargo_description LIKE ?)');
    const value = `%${queryParams.q}%`;
    params.push(value, value, value, value);
  }
  if (queryParams.status) {
    where.push('b.shipment_status = ?');
    params.push(queryParams.status);
  }
  if (queryParams.customer) {
    where.push('(b.customer_name LIKE ? OR b.company_name LIKE ?)');
    params.push(`%${queryParams.customer}%`, `%${queryParams.customer}%`);
  }
  if (queryParams.origin) {
    where.push('b.origin_airport = ?');
    params.push(cleanAirport(queryParams.origin));
  }
  if (queryParams.destination) {
    where.push('b.destination_airport = ?');
    params.push(cleanAirport(queryParams.destination));
  }
  if (queryParams.owner) {
    where.push('b.assigned_owner_id = ?');
    params.push(Number(queryParams.owner));
  }
  if (queryParams.dateFrom) {
    where.push('b.booking_date >= ?');
    params.push(queryParams.dateFrom);
  }
  if (queryParams.dateTo) {
    where.push('b.booking_date <= ?');
    params.push(queryParams.dateTo);
  }
  if (queryParams.pendingDocuments === '1') {
    where.push(`EXISTS (
      SELECT 1 FROM documents d
      WHERE d.booking_id = b.id AND d.status IN ('Pending','Rejected')
    )`);
  }

  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

const listBookings = asyncHandler(async (req, res) => {
  const filters = buildListWhere(req.query);
  const rows = await query(
    `SELECT b.*, u.name AS assigned_owner, p.payment_status, p.balance_amount
     FROM bookings b
     LEFT JOIN users u ON u.id = b.assigned_owner_id
     LEFT JOIN payments p ON p.booking_id = b.id
     ${filters.sql}
     ORDER BY b.booking_date DESC, b.id DESC`,
    filters.params
  );
  res.json({ bookings: rows });
});

const getBooking = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT b.*, u.name AS assigned_owner, p.quotation_amount, p.invoice_amount, p.paid_amount,
            p.balance_amount, p.payment_status, p.payment_date, p.payment_method, p.due_date
     FROM bookings b
     LEFT JOIN users u ON u.id = b.assigned_owner_id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.id = ? OR b.booking_id = ?
     LIMIT 1`,
    [req.params.id, req.params.id]
  );

  if (!rows.length) {
    throw createHttpError('Booking not found.', 404);
  }

  const booking = rows[0];
  const documents = await query('SELECT * FROM documents WHERE booking_id = ? ORDER BY document_type ASC', [booking.id]);
  const milestones = await query(
    `SELECT m.*, u.name AS created_by_name
     FROM shipment_milestones m
     LEFT JOIN users u ON u.id = m.created_by
     WHERE m.booking_id = ?
     ORDER BY m.created_at ASC`,
    [booking.id]
  );

  res.json({ booking, documents, milestones });
});

const createBooking = asyncHandler(async (req, res) => {
  validateBookingPayload(req.body);
  const payload = normalizeBooking(req.body);

  const created = await transaction(async (connection) => {
    const bookingCode = req.body.booking_id || (await generateBookingId(connection));
    const customerId = await findOrCreateCustomer(connection, payload);
    const [result] = await connection.query(
      `INSERT INTO bookings
       (booking_id, customer_id, customer_name, customer_email, customer_phone, company_name,
        origin_airport, destination_airport, pickup_city, delivery_city, cargo_type, cargo_description,
        package_count, actual_weight, length_cm, width_cm, height_cm, volumetric_weight, chargeable_weight,
        shipment_status, booking_date, expected_delivery_date, actual_delivery_date, assigned_owner_id,
        priority, notes, created_by, awb_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingCode,
        customerId,
        payload.customer_name,
        payload.customer_email,
        payload.customer_phone,
        payload.company_name,
        payload.origin_airport,
        payload.destination_airport,
        payload.pickup_city,
        payload.delivery_city,
        payload.cargo_type,
        payload.cargo_description || null,
        payload.package_count,
        payload.actual_weight,
        payload.length_cm,
        payload.width_cm,
        payload.height_cm,
        payload.volumetric_weight,
        payload.chargeable_weight,
        payload.shipment_status,
        payload.booking_date,
        payload.expected_delivery_date,
        payload.actual_delivery_date,
        payload.assigned_owner_id,
        payload.priority,
        payload.notes || null,
        req.user.id,
        payload.awb_number || bookingCode
      ]
    );

    // Create corresponding shipment record in shipments table
    await connection.query(
      `INSERT INTO shipments (booking_id, awb_number, origin, destination, current_status, expected_delivery_date, current_location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        payload.awb_number || bookingCode,
        payload.origin_airport,
        payload.destination_airport,
        payload.shipment_status,
        payload.expected_delivery_date,
        payload.pickup_city
      ]
    );

    await ensureDefaultDocuments(connection, result.insertId);
    const invoiceAmount = Number(req.body.invoice_amount || 0);
    const paidAmount = Number(req.body.paid_amount || 0);
    const dueDate = req.body.payment_due_date || payload.expected_delivery_date;
    await connection.query(
      `INSERT INTO payments (booking_id, quotation_amount, invoice_amount, paid_amount, balance_amount, payment_status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        Number(req.body.quotation_amount || 0),
        invoiceAmount,
        paidAmount,
        Math.max(invoiceAmount - paidAmount, 0),
        resolveInitialPaymentStatus(invoiceAmount, paidAmount, dueDate),
        dueDate
      ]
    );
    await connection.query(
      `INSERT INTO shipment_milestones (booking_id, status, location, remarks, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, payload.shipment_status, payload.pickup_city, 'Booking created.', req.user.id]
    );

    return { id: result.insertId, booking_id: bookingCode };
  });

  await logActivity({
    userId: req.user.id,
    actionType: 'Booking',
    title: `Booking ${created.booking_id} created`,
    description: `${payload.customer_name} - ${payload.origin_airport} to ${payload.destination_airport}`,
    relatedType: 'booking',
    relatedId: created.id
  });

  socketHelper.emit('bookings:update', { id: created.id, action: 'create' });
  socketHelper.emit('dashboard:update', { type: 'bookings' });

  const rows = await query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [created.id]);
  res.status(201).json({ message: 'Booking created successfully.', booking: rows[0] || created });
});

const updateBooking = asyncHandler(async (req, res) => {
  validateBookingPayload(req.body, true);
  const rows = await query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw createHttpError('Booking not found.', 404);

  const payload = normalizeBooking(req.body, rows[0]);
  await query(
    `UPDATE bookings SET
      customer_name = ?, customer_email = ?, customer_phone = ?, company_name = ?,
      origin_airport = ?, destination_airport = ?, pickup_city = ?, delivery_city = ?,
      cargo_type = ?, cargo_description = ?, package_count = ?, actual_weight = ?,
      length_cm = ?, width_cm = ?, height_cm = ?, volumetric_weight = ?, chargeable_weight = ?,
      shipment_status = ?, booking_date = ?, expected_delivery_date = ?, actual_delivery_date = ?,
      assigned_owner_id = ?, priority = ?, notes = ?, awb_number = ?
     WHERE id = ?`,
    [
      payload.customer_name,
      payload.customer_email,
      payload.customer_phone,
      payload.company_name,
      payload.origin_airport,
      payload.destination_airport,
      payload.pickup_city,
      payload.delivery_city,
      payload.cargo_type,
      payload.cargo_description || null,
      payload.package_count,
      payload.actual_weight,
      payload.length_cm,
      payload.width_cm,
      payload.height_cm,
      payload.volumetric_weight,
      payload.chargeable_weight,
      payload.shipment_status,
      payload.booking_date,
      payload.expected_delivery_date,
      payload.actual_delivery_date,
      payload.assigned_owner_id,
      payload.priority,
      payload.notes || null,
      payload.awb_number || null,
      req.params.id
    ]
  );

  // Sync corresponding record in shipments table
  const existingShipment = await query('SELECT id FROM shipments WHERE booking_id = ? LIMIT 1', [req.params.id]);
  if (existingShipment.length) {
    await query(
      `UPDATE shipments SET
        awb_number = ?, origin = ?, destination = ?, current_status = ?, expected_delivery_date = ?
       WHERE booking_id = ?`,
      [
        payload.awb_number || null,
        payload.origin_airport || null,
        payload.destination_airport || null,
        payload.shipment_status || 'Pending',
        payload.expected_delivery_date || null,
        req.params.id
      ]
    );
  } else {
    await query(
      `INSERT INTO shipments (booking_id, awb_number, origin, destination, current_status, expected_delivery_date, current_location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        payload.awb_number || null,
        payload.origin_airport,
        payload.destination_airport,
        payload.shipment_status,
        payload.expected_delivery_date,
        payload.pickup_city
      ]
    );
  }

  await logActivity({
    userId: req.user.id,
    actionType: 'Booking',
    title: `Booking ${rows[0].booking_id} updated`,
    description: `${payload.customer_name} - ${payload.shipment_status}`,
    relatedType: 'booking',
    relatedId: req.params.id
  });

  socketHelper.emit('bookings:update', { id: req.params.id, action: 'update' });
  socketHelper.emit('dashboard:update', { type: 'bookings' });

  const updated = await query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ message: 'Booking updated successfully.', booking: updated[0] });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const rows = await query('SELECT booking_id FROM bookings WHERE id = ? LIMIT 1', [req.params.id]);
  const result = await query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw createHttpError('Booking not found.', 404);
  await logActivity({
    userId: req.user.id,
    actionType: 'Booking',
    title: `Booking ${rows[0]?.booking_id || req.params.id} deleted`,
    relatedType: 'booking',
    relatedId: req.params.id
  });

  socketHelper.emit('bookings:update', { id: req.params.id, action: 'delete' });
  socketHelper.emit('dashboard:update', { type: 'bookings' });

  res.json({ message: 'Booking deleted successfully.' });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, location, remarks, actual_delivery_date } = req.body;
  assertRequired(req.body, ['status']);
  assertIn(status, BOOKING_STATUSES, 'Shipment status');

  const deliveredDate = ['Delivered', 'Completed'].includes(status)
    ? actual_delivery_date || new Date().toISOString().slice(0, 10)
    : actual_delivery_date || null;

  const result = await query(
    'UPDATE bookings SET shipment_status = ?, actual_delivery_date = COALESCE(?, actual_delivery_date) WHERE id = ?',
    [status, deliveredDate, req.params.id]
  );
  if (!result.affectedRows) throw createHttpError('Booking not found.', 404);

  // Sync with shipments table
  const isDelayed = status === 'Delayed' ? 1 : 0;
  await query(
    'UPDATE shipments SET current_status = ?, is_delayed = ? WHERE booking_id = ?',
    [status, isDelayed, req.params.id]
  );

  await query(
    `INSERT INTO shipment_milestones (booking_id, status, location, remarks, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, status, location || 'Operations', remarks || 'Status updated.', req.user.id]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Shipment',
    title: `Shipment status updated to ${status}`,
    description: remarks || 'Status updated.',
    relatedType: 'booking',
    relatedId: req.params.id
  });

  socketHelper.emit('bookings:update', { id: req.params.id, action: 'status_update' });
  socketHelper.emit('dashboard:update', { type: 'bookings' });

  const updated = await query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ message: 'Shipment status updated successfully.', booking: updated[0] });
});

const getTimeline = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT m.*, u.name AS updated_by
     FROM shipment_milestones m
     LEFT JOIN users u ON u.id = m.created_by
     WHERE m.booking_id = ?
     ORDER BY m.created_at ASC, m.id ASC`,
    [req.params.id]
  );
  res.json({ timeline: rows || [] });
});

const addTimelineEntry = asyncHandler(async (req, res) => {
  const { status, location, remarks } = req.body;
  assertRequired(req.body, ['status']);
  assertIn(status, BOOKING_STATUSES, 'Shipment status');

  const result = await query(
    `INSERT INTO shipment_milestones (booking_id, status, location, remarks, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, status, location || 'Operations', remarks || null, req.user.id]
  );
  await logActivity({
    userId: req.user.id,
    actionType: 'Shipment',
    title: `Timeline updated: ${status}`,
    description: remarks || 'Shipment timeline entry added.',
    relatedType: 'booking',
    relatedId: req.params.id
  });
  res.status(201).json({ message: 'Timeline entry added.', milestone: { id: result.insertId } });
});

module.exports = {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  updateStatus,
  getTimeline,
  addTimelineEntry
};
