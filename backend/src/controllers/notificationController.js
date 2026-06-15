const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { runAlertChecks } = require('../services/alertService');
const { createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

const listNotifications = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT n.*, b.booking_id
     FROM notifications n
     LEFT JOIN bookings b ON b.id = n.related_booking_id
     WHERE n.user_id IS NULL OR n.user_id = ?
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT 100`,
    [req.user.id]
  );
  res.json({ notifications: rows });
});

const markRead = asyncHandler(async (req, res) => {
  const result = await query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) throw createHttpError('Notification not found.', 404);
  res.json({ message: 'Notification marked as read.' });
});

const dismissNotification = asyncHandler(async (req, res) => {
  const result = await query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) throw createHttpError('Notification not found.', 404);
  await logActivity({
    userId: req.user.id,
    actionType: 'Alert',
    title: 'Notification dismissed',
    relatedType: 'notification',
    relatedId: req.params.id
  });
  res.json({ message: 'Notification dismissed.' });
});

const assignTaskFromNotification = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw createHttpError('Notification not found.', 404);
  const notification = rows[0];
  const result = await query(
    `INSERT INTO tasks (title, description, priority, assigned_to, due_date, status, related_booking_id, created_by)
     VALUES (?, ?, ?, ?, CURDATE(), 'To Do', ?, ?)`,
    [
      notification.title,
      notification.message,
      notification.severity === 'Critical' ? 'Critical' : 'High',
      req.body.assigned_to || req.user.id,
      notification.related_booking_id || null,
      req.user.id
    ]
  );
  await logActivity({
    userId: req.user.id,
    actionType: 'Task',
    title: 'Task assigned from notification',
    description: notification.title,
    relatedType: 'task',
    relatedId: result.insertId
  });
  res.status(201).json({ message: 'Task assigned from alert.', task: { id: result.insertId } });
});

const runAlerts = asyncHandler(async (req, res) => {
  const result = await runAlertChecks();
  res.json({
    message: `Alert check completed. ${result.createdCount} new notifications created.`,
    ...result
  });
});

module.exports = {
  listNotifications,
  markRead,
  dismissNotification,
  assignTaskFromNotification,
  runAlerts
};
