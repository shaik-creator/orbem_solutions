const { query, transaction } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertRequired, assertIn, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');
const socketHelper = require('../config/socket');

const SHIPMENT_STATUSES = ['Pending', 'Picked Up', 'In Transit', 'Customs Clearance', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled', 'Delayed'];

const listShipments = asyncHandler(async (req, res) => {
  const params = [];
  const where = [];
  
  if (req.query.q) {
    where.push('(s.awb_number LIKE ? OR b.booking_id LIKE ? OR b.customer_name LIKE ?)');
    const val = `%${req.query.q}%`;
    params.push(val, val, val);
  }
  if (req.query.status) {
    where.push('s.current_status = ?');
    params.push(req.query.status);
  }
  if (req.query.is_delayed) {
    where.push('s.is_delayed = ?');
    params.push(req.query.is_delayed === '1' ? 1 : 0);
  }

  const rows = await query(
    `SELECT s.*, b.booking_id, b.customer_name, b.origin_airport, b.destination_airport,
            b.chargeable_weight, b.expected_delivery_date
     FROM shipments s
     LEFT JOIN bookings b ON b.id = s.booking_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY s.created_at DESC, s.id DESC`,
    params
  );
  
  res.json({ shipments: rows });
});

const getShipment = asyncHandler(async (req, res) => {
  const shipments = await query(
    `SELECT s.*, b.booking_id, b.customer_name, b.origin_airport, b.destination_airport,
            b.chargeable_weight, b.expected_delivery_date, b.cargo_type
     FROM shipments s
     LEFT JOIN bookings b ON b.id = s.booking_id
     WHERE s.id = ? OR s.awb_number = ?
     LIMIT 1`,
    [req.params.id, req.params.id]
  );

  if (!shipments.length) {
    throw createHttpError('Shipment not found.', 404);
  }

  const timeline = await query(
    'SELECT * FROM shipment_timeline WHERE shipment_id = ? ORDER BY created_at ASC',
    [shipments[0].id]
  );

  res.json({ shipment: shipments[0], timeline });
});

const createShipment = asyncHandler(async (req, res) => {
  const { booking_id, awb_number, origin, destination, expected_delivery_date } = req.body;
  assertRequired(req.body, ['booking_id', 'origin', 'destination']);

  const bookings = await query('SELECT id, booking_id FROM bookings WHERE id = ? LIMIT 1', [booking_id]);
  if (!bookings.length) {
    throw createHttpError('Booking not found.', 404);
  }

  const result = await query(
    `INSERT INTO shipments (booking_id, awb_number, origin, destination, current_status, expected_delivery_date)
     VALUES (?, ?, ?, ?, 'Pending', ?)`,
    [booking_id, awb_number || null, origin, destination, expected_delivery_date || null]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Shipment',
    title: 'Shipment created',
    description: `${origin} to ${destination}`,
    relatedType: 'shipment',
    relatedId: result.insertId
  });

  socketHelper.emit('shipments:update', { id: result.insertId, action: 'create', booking_id });
  socketHelper.emit('bookings:update', { id: booking_id, action: 'update' });
  socketHelper.emit('dashboard:update', { type: 'shipments' });

  const rows = await query('SELECT * FROM shipments WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({
    message: 'Shipment created successfully.',
    shipment: rows[0]
  });
});

const updateShipment = asyncHandler(async (req, res) => {
  const { origin, destination, current_location, expected_delivery_date } = req.body;
  
  const shipments = await query('SELECT * FROM shipments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!shipments.length) {
    throw createHttpError('Shipment not found.', 404);
  }

  await query(
    `UPDATE shipments SET
      origin = ?, destination = ?, current_location = ?, expected_delivery_date = ?
     WHERE id = ?`,
    [origin || shipments[0].origin, destination || shipments[0].destination, current_location, expected_delivery_date, req.params.id]
  );

  // Sync with bookings table
  await query(
    `UPDATE bookings SET
      origin_airport = ?, destination_airport = ?, expected_delivery_date = ?
     WHERE id = ?`,
    [origin || shipments[0].origin, destination || shipments[0].destination, expected_delivery_date, shipments[0].booking_id]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Shipment',
    title: 'Shipment updated',
    description: `Shipment ${shipments[0].awb_number || req.params.id}`,
    relatedType: 'shipment',
    relatedId: req.params.id
  });

  socketHelper.emit('shipments:update', { id: req.params.id, action: 'update', booking_id: shipments[0].booking_id });
  socketHelper.emit('bookings:update', { id: shipments[0].booking_id, action: 'update' });
  socketHelper.emit('dashboard:update', { type: 'shipments' });

  const updated = await query('SELECT * FROM shipments WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ message: 'Shipment updated successfully.', shipment: updated[0] });
});

const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { current_status, current_location, note } = req.body;
  assertRequired(req.body, ['current_status']);
  assertIn(current_status, SHIPMENT_STATUSES, 'Current status');

  const shipments = await query('SELECT * FROM shipments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!shipments.length) {
    throw createHttpError('Shipment not found.', 404);
  }

  const isDelayed = current_status === 'Delayed' ? 1 : shipments[0].is_delayed;

  await query(
    `UPDATE shipments SET current_status = ?, current_location = ?, is_delayed = ?
     WHERE id = ?`,
    [current_status, current_location, isDelayed, req.params.id]
  );

  // Sync with bookings table
  await query(
    `UPDATE bookings SET shipment_status = ? WHERE id = ?`,
    [current_status, shipments[0].booking_id]
  );

  // Add timeline entry
  await query(
    `INSERT INTO shipment_timeline (shipment_id, status, location, note, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, current_status, current_location || null, note || null, req.user.id]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Shipment Status',
    title: `Status changed to ${current_status}`,
    description: note || 'Status update',
    relatedType: 'shipment',
    relatedId: req.params.id
  });

  socketHelper.emit('shipments:update', { id: req.params.id, action: 'status_update', booking_id: shipments[0].booking_id });
  socketHelper.emit('bookings:update', { id: shipments[0].booking_id, action: 'status_update' });
  socketHelper.emit('dashboard:update', { type: 'shipments' });

  const updated = await query('SELECT * FROM shipments WHERE id = ? LIMIT 1', [req.params.id]);
  res.json({ message: 'Shipment status updated successfully.', shipment: updated[0] });
});

const addTimelineEntry = asyncHandler(async (req, res) => {
  const { status, location, note } = req.body;
  assertRequired(req.body, ['status']);

  const shipments = await query('SELECT * FROM shipments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!shipments.length) {
    throw createHttpError('Shipment not found.', 404);
  }

  const result = await query(
    `INSERT INTO shipment_timeline (shipment_id, status, location, note, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, status, location || null, note || null, req.user.id]
  );

  res.status(201).json({
    message: 'Timeline entry added successfully.',
    entry: { id: result.insertId, status, location, note }
  });
});

const deleteShipment = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM shipments WHERE id = ?', [req.params.id]);
  
  if (!result.affectedRows) {
    throw createHttpError('Shipment not found.', 404);
  }

  await logActivity({
    userId: req.user.id,
    actionType: 'Shipment',
    title: 'Shipment deleted',
    relatedType: 'shipment',
    relatedId: req.params.id
  });

  socketHelper.emit('shipments:update', { id: req.params.id, action: 'delete', booking_id: shipments[0]?.booking_id });
  if (shipments[0]?.booking_id) {
    socketHelper.emit('bookings:update', { id: shipments[0].booking_id, action: 'update' });
  }
  socketHelper.emit('dashboard:update', { type: 'shipments' });

  res.json({ message: 'Shipment deleted successfully.' });
});

module.exports = {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  addTimelineEntry,
  deleteShipment
};
