const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertRequired, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');
const socketHelper = require('../config/socket');

// Get all alerts
const listAlerts = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT * FROM alerts
     ORDER BY is_read ASC, created_at DESC
     LIMIT 100`
  );
  res.json({ alerts: rows });
});

// Get unread alerts count
const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await query('SELECT COUNT(*) AS count FROM alerts WHERE is_read = 0');
  res.json({ unreadCount: result[0]?.count || 0 });
});

// Mark alert as read
const markAsRead = asyncHandler(async (req, res) => {
  const result = await query('UPDATE alerts SET is_read = 1 WHERE id = ?', [req.params.id]);
  
  if (!result.affectedRows) {
    throw createHttpError('Alert not found.', 404);
  }
  
  socketHelper.emit('alerts:update', { id: req.params.id, action: 'read' });
  socketHelper.emit('dashboard:update', { type: 'alerts' });

  res.json({ message: 'Alert marked as read.' });
});

// Check for new alerts (delayed shipments, overdue payments, pending documents)
const checkAlerts = asyncHandler(async (req, res) => {
  const alerts = [];

  // Check for delayed shipments
  const delayedShipments = await query(
    `SELECT COUNT(*) AS count FROM shipments 
     WHERE is_delayed = 0 AND current_status != 'Delayed'
     AND expected_delivery_date < CURDATE() 
     AND current_status NOT IN ('Delivered', 'Completed', 'Cancelled')`
  );

  if (delayedShipments[0]?.count > 0) {
    const existingAlert = await query(
      `SELECT id FROM alerts WHERE type = 'Delayed Shipments' 
       AND is_read = 0 AND DATE(created_at) = CURDATE()`
    );

    if (!existingAlert.length) {
      const result = await query(
        `INSERT INTO alerts (type, title, message, severity, is_read)
         VALUES ('Delayed Shipments', 'Multiple Delayed Shipments', 
                 ?, 'Critical', 0)`,
        [`${delayedShipments[0].count} shipments are delayed beyond expected delivery date.`]
      );
      alerts.push({ id: result.insertId, type: 'Delayed Shipments' });
    }
  }

  // Check for overdue payments
  const overduePayments = await query(
    `SELECT COUNT(*) AS count FROM payments 
     WHERE payment_status NOT IN ('Paid', 'Cancelled')
     AND due_date < CURDATE() AND balance_amount > 0`
  );

  if (overduePayments[0]?.count > 0) {
    const existingAlert = await query(
      `SELECT id FROM alerts WHERE type = 'Overdue Payments' 
       AND is_read = 0 AND DATE(created_at) = CURDATE()`
    );

    if (!existingAlert.length) {
      const result = await query(
        `INSERT INTO alerts (type, title, message, severity, is_read)
         VALUES ('Overdue Payments', 'Overdue Payment Due', 
                 ?, 'Warning', 0)`,
        [`${overduePayments[0].count} invoices are overdue.`]
      );
      alerts.push({ id: result.insertId, type: 'Overdue Payments' });
    }
  }

  // Check for pending documents
  const pendingDocs = await query(
    `SELECT COUNT(*) AS count FROM documents d
     JOIN bookings b ON b.id = d.booking_id
     WHERE d.status = 'Pending' AND b.expected_delivery_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)`
  );

  if (pendingDocs[0]?.count > 0) {
    const existingAlert = await query(
      `SELECT id FROM alerts WHERE type = 'Pending Documents' 
       AND is_read = 0 AND DATE(created_at) = CURDATE()`
    );

    if (!existingAlert.length) {
      const result = await query(
        `INSERT INTO alerts (type, title, message, severity, is_read)
         VALUES ('Pending Documents', 'Documents Need Attention', 
                 ?, 'Warning', 0)`,
        [`${pendingDocs[0].count} documents are pending for delivery in next 2 days.`]
      );
      alerts.push({ id: result.insertId, type: 'Pending Documents' });
    }
  }

  if (alerts.length > 0) {
    socketHelper.emit('alerts:update', { action: 'check' });
    socketHelper.emit('dashboard:update', { type: 'alerts' });
  }

  res.json({
    message: `${alerts.length} new alerts created.`,
    alerts,
    summary: {
      delayedShipments: delayedShipments[0]?.count || 0,
      overduePayments: overduePayments[0]?.count || 0,
      pendingDocuments: pendingDocs[0]?.count || 0
    }
  });
});

// Delete alert
const deleteAlert = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM alerts WHERE id = ?', [req.params.id]);
  
  if (!result.affectedRows) {
    throw createHttpError('Alert not found.', 404);
  }
  
  socketHelper.emit('alerts:update', { id: req.params.id, action: 'delete' });
  socketHelper.emit('dashboard:update', { type: 'alerts' });

  res.json({ message: 'Alert deleted.' });
});

module.exports = {
  listAlerts,
  getUnreadCount,
  markAsRead,
  checkAlerts,
  deleteAlert
};
