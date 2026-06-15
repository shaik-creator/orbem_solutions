const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');

async function readActivityLogs(limit) {
  try {
    return await query(
      `SELECT a.*, u.name AS user_name
       FROM activity_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ${limit}`
    );
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return [];
    throw error;
  }
}

async function derivedActivity(limit) {
  const rows = await query(
    `(SELECT 'Booking' AS action_type, CONCAT('Booking ', booking_id, ' created') AS title,
             CONCAT(customer_name, ' - ', origin_airport, ' to ', destination_airport) AS description,
             'booking' AS related_type, id AS related_id, created_at
      FROM bookings)
     UNION ALL
     (SELECT 'Shipment' AS action_type, CONCAT('Shipment ', b.booking_id, ' updated to ', m.status) AS title,
             COALESCE(m.remarks, 'Shipment milestone updated') AS description,
             'booking' AS related_type, b.id AS related_id, m.created_at
      FROM shipment_milestones m
      JOIN bookings b ON b.id = m.booking_id)
     UNION ALL
     (SELECT 'Alert' AS action_type, title, message AS description,
             'booking' AS related_type, related_booking_id AS related_id, created_at
      FROM notifications)
     UNION ALL
     (SELECT 'Assistant' AS action_type, 'Assistant used' AS title, LEFT(message, 180) AS description,
             'assistant' AS related_type, id AS related_id, created_at
     FROM chat_messages
     WHERE role = 'user')
     ORDER BY created_at DESC
     LIMIT ${limit}`
  );
  return rows;
}

const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);
  const logs = await readActivityLogs(limit);
  const activity = logs.length ? logs : await derivedActivity(limit);
  res.json({ activity: activity || [] });
});

module.exports = {
  recentActivity
};
