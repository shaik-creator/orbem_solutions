const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const events = asyncHandler(async (req, res) => {
  const from = req.query.from || todayIso();
  const to = req.query.to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let customEvents = [];
  try {
    customEvents = await query(
      `SELECT id, title, event_type, event_date, event_time, related_type, related_id, status
       FROM calendar_events
       WHERE event_date BETWEEN ? AND ?
       ORDER BY event_date ASC, event_time ASC`,
      [from, to]
    );
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
  }

  const derived = await query(
    `(SELECT b.id, CONCAT('Delivery expected: ', b.booking_id) AS title, 'Delivery' AS event_type,
             b.expected_delivery_date AS event_date, NULL AS event_time, 'booking' AS related_type,
             b.id AS related_id, b.shipment_status AS status
      FROM bookings b
      WHERE b.expected_delivery_date BETWEEN ? AND ?)
     UNION ALL
     (SELECT p.id, CONCAT('Payment due: ', b.booking_id) AS title, 'Payment' AS event_type,
             p.due_date AS event_date, NULL AS event_time, 'booking' AS related_type,
             b.id AS related_id, p.payment_status AS status
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE p.due_date BETWEEN ? AND ?)
     UNION ALL
     (SELECT b.id, CONCAT('Pickup follow-up: ', b.booking_id) AS title, 'Pickup' AS event_type,
             b.booking_date AS event_date, NULL AS event_time, 'booking' AS related_type,
             b.id AS related_id, b.shipment_status AS status
      FROM bookings b
      WHERE b.booking_date BETWEEN ? AND ?)
     ORDER BY event_date ASC`,
    [from, to, from, to, from, to]
  );

  res.json({ events: [...customEvents, ...derived] });
});

module.exports = {
  events
};
