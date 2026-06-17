const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { query, transaction } = require('../config/db');
const { logActivity } = require('./activityService');

async function createEmailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function notifyOptionalChannels(notification) {
  const transporter = await createEmailTransporter();
  if (!transporter || !process.env.SMTP_FROM) return;

  const admins = await query("SELECT email FROM users WHERE role = 'Admin / Owner' AND is_active = 1");
  if (!admins.length) return;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: admins.map((admin) => admin.email).join(','),
      subject: `[ORBEM Alert] ${notification.title}`,
      text: notification.message
    });
  } catch (error) {
    console.warn('Optional email alert failed:', error.message);
  }
}

async function createNotificationOnce(notification) {
  const existing = await query(
    `SELECT id FROM notifications
     WHERE title = ? AND COALESCE(related_booking_id, 0) = COALESCE(?, 0) AND DATE(created_at) = CURDATE()
     LIMIT 1`,
    [notification.title, notification.related_booking_id || null]
  );

  if (existing.length) return null;

  const result = await query(
    `INSERT INTO notifications (user_id, title, message, type, severity, related_booking_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      notification.user_id || null,
      notification.title,
      notification.message,
      notification.type || 'System',
      notification.severity || 'Info',
      notification.related_booking_id || null
    ]
  );

  const created = { id: result.insertId, ...notification };
  await logActivity({
    userId: notification.user_id || null,
    actionType: 'Alert',
    title: notification.title,
    description: notification.message,
    relatedType: notification.related_booking_id ? 'booking' : 'notification',
    relatedId: notification.related_booking_id || result.insertId
  });
  await notifyOptionalChannels(created);
  return created;
}

async function markDelayedShipments() {
  const candidates = await query(
    `SELECT id, booking_id, expected_delivery_date
     FROM bookings
     WHERE expected_delivery_date < CURDATE()
       AND shipment_status NOT IN ('Delivered','Completed','Cancelled','Delayed')`
  );

  if (!candidates.length) return [];

  await transaction(async (connection) => {
    const ids = candidates.map((booking) => booking.id);
    await connection.query('UPDATE bookings SET shipment_status = ? WHERE id IN (?)', ['Delayed', ids]);
    for (const booking of candidates) {
      await connection.query(
        `INSERT INTO shipment_milestones (booking_id, status, location, remarks)
         VALUES (?, 'Delayed', 'System', ?)`,
        [booking.id, `Expected delivery date ${booking.expected_delivery_date} has passed.`]
      );
    }
  });

  return candidates;
}

async function updateOverduePayments() {
  await query(
    `UPDATE payments
     SET payment_status = 'Overdue'
     WHERE balance_amount > 0 AND due_date < CURDATE() AND payment_status <> 'Paid'`
  );
}

async function runAlertChecks() {
  const notifications = [];
  const newlyDelayed = await markDelayedShipments();
  await updateOverduePayments();

  for (const booking of newlyDelayed) {
    const created = await createNotificationOnce({
      title: 'Shipment delayed automatically',
      message: `${booking.booking_id} was marked delayed because the expected delivery date has passed.`,
      type: 'Shipment',
      severity: 'Critical',
      related_booking_id: booking.id
    });
    if (created) notifications.push(created);
  }

  const delayedRows = await query(
    `SELECT id, booking_id, expected_delivery_date FROM bookings
     WHERE shipment_status = 'Delayed'
     ORDER BY expected_delivery_date ASC LIMIT 20`
  );
  for (const booking of delayedRows) {
    const created = await createNotificationOnce({
      title: 'Delayed shipment requires action',
      message: `${booking.booking_id} is delayed beyond the expected delivery date.`,
      type: 'Shipment',
      severity: 'Critical',
      related_booking_id: booking.id
    });
    if (created) notifications.push(created);
  }

  const documentRows = await query(
    `SELECT b.id, b.booking_id, GROUP_CONCAT(d.document_type ORDER BY d.document_type SEPARATOR ', ') AS docs
     FROM bookings b
     JOIN documents d ON d.booking_id = b.id
     WHERE d.status IN ('Pending','Rejected')
     GROUP BY b.id
     LIMIT 30`
  );
  for (const row of documentRows) {
    const created = await createNotificationOnce({
      title: 'Pending document reminder',
      message: `${row.booking_id} still needs: ${row.docs}.`,
      type: 'Document',
      severity: 'Warning',
      related_booking_id: row.id
    });
    if (created) notifications.push(created);
  }

  const overduePayments = await query(
    `SELECT b.id, b.booking_id, p.balance_amount
     FROM bookings b
     JOIN payments p ON p.booking_id = b.id
     WHERE p.payment_status = 'Overdue' AND p.balance_amount > 0
     LIMIT 30`
  );
  for (const row of overduePayments) {
    const created = await createNotificationOnce({
      title: 'Payment overdue',
      message: `${row.booking_id} has an overdue balance of INR ${Number(row.balance_amount).toFixed(2)}.`,
      type: 'Payment',
      severity: 'Critical',
      related_booking_id: row.id
    });
    if (created) notifications.push(created);
  }

  const dueTomorrow = await query(
    `SELECT id, booking_id, expected_delivery_date
     FROM bookings
     WHERE expected_delivery_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
       AND shipment_status NOT IN ('Delivered','Completed','Cancelled')
     LIMIT 30`
  );
  for (const row of dueTomorrow) {
    const created = await createNotificationOnce({
      title: 'Expected delivery tomorrow',
      message: `${row.booking_id} is expected on ${row.expected_delivery_date}. Confirm milestone readiness.`,
      type: 'Reminder',
      severity: 'Info',
      related_booking_id: row.id
    });
    if (created) notifications.push(created);
  }

  const highPriority = await query(
    `SELECT id, booking_id, priority, shipment_status
     FROM bookings
     WHERE priority IN ('High','Critical')
       AND shipment_status IN ('Booked','Picked Up','In Warehouse','Documents Pending','Customs Hold','Delayed')
     LIMIT 30`
  );
  for (const row of highPriority) {
    const created = await createNotificationOnce({
      title: 'High priority booking pending',
      message: `${row.booking_id} is ${row.priority || 'high priority'} and currently ${row.shipment_status}.`,
      type: 'Shipment',
      severity: 'Warning',
      related_booking_id: row.id
    });
    if (created) notifications.push(created);
  }

  return {
    createdCount: notifications.length,
    notifications
  };
}

function scheduleDailyAlerts() {
  cron.schedule('0 9 * * *', () => {
    runAlertChecks().catch((error) => console.error('Scheduled alert check failed:', error.message));
  });
}

module.exports = {
  runAlertChecks,
  scheduleDailyAlerts
};
