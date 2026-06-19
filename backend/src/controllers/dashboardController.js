const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { getDashboardSummary } = require('../services/dashboardSummaryService');

function safeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function toNumber(value) {
  return Number(value || 0);
}

const summary = asyncHandler(async (req, res) => {
  const data = await getDashboardSummary(req.query);
  res.json(data);
});

const revenue = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT DATE_FORMAT(b.booking_date, '%Y-%m') AS month_key,
            COALESCE(SUM(p.invoice_amount), 0) AS invoiced_amount,
            COALESCE(SUM(p.paid_amount), 0) AS received_amount,
            COALESCE(SUM(p.balance_amount), 0) AS pending_amount
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     GROUP BY DATE_FORMAT(b.booking_date, '%Y-%m')
     ORDER BY month_key ASC`
  );
  res.json({
    revenue: safeRows(rows).map((row) => ({
      month_key: row.month_key || '',
      invoiced_amount: toNumber(row.invoiced_amount),
      received_amount: toNumber(row.received_amount),
      pending_amount: toNumber(row.pending_amount)
    }))
  });
});

const status = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT COALESCE(NULLIF(shipment_status, ''), 'Unknown') AS shipment_status,
            COUNT(*) AS status_count
     FROM bookings
     GROUP BY COALESCE(NULLIF(shipment_status, ''), 'Unknown')
     ORDER BY status_count DESC`
  );
  res.json({
    statuses: safeRows(rows).map((row) => ({
      shipment_status: row.shipment_status || 'Unknown',
      status_count: toNumber(row.status_count)
    }))
  });
});

const customerBusiness = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT COALESCE(NULLIF(b.company_name, ''), 'Unknown') AS company_name,
            COUNT(DISTINCT b.id) AS booking_count,
            COALESCE(SUM(p.invoice_amount), 0) AS revenue_amount
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     GROUP BY COALESCE(NULLIF(b.company_name, ''), 'Unknown')
     ORDER BY revenue_amount DESC
     LIMIT 10`
  );
  res.json({
    customers: safeRows(rows).map((row) => ({
      company_name: row.company_name || 'Unknown',
      booking_count: toNumber(row.booking_count),
      revenue_amount: toNumber(row.revenue_amount)
    }))
  });
});

const delayedTrend = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT DATE_FORMAT(expected_delivery_date, '%Y-%m') AS month_key,
            COUNT(*) AS delayed_count
     FROM bookings
     WHERE expected_delivery_date IS NOT NULL
       AND (
         shipment_status = 'Delayed'
         OR (expected_delivery_date < CURDATE() AND shipment_status NOT IN ('Delivered','Completed','Cancelled'))
       )
     GROUP BY DATE_FORMAT(expected_delivery_date, '%Y-%m')
     ORDER BY month_key ASC`
  );
  res.json({
    delayedTrend: safeRows(rows).map((row) => ({
      month_key: row.month_key || '',
      delayed_count: toNumber(row.delayed_count)
    }))
  });
});

const today = asyncHandler(async (req, res) => {
  const [bookingsToday] = await query("SELECT COUNT(*) AS count FROM bookings WHERE booking_date = CURDATE()");
  const [expectedToday] = await query(
    "SELECT COUNT(*) AS count FROM bookings WHERE expected_delivery_date = CURDATE() AND shipment_status NOT IN ('Delivered','Completed','Cancelled')"
  );
  const [pickupsToday] = await query(
    "SELECT COUNT(*) AS count FROM bookings WHERE booking_date = CURDATE() AND shipment_status IN ('Booked','Picked Up')"
  );
  const [documentsToday] = await query(
    `SELECT COUNT(DISTINCT b.id) AS count
     FROM bookings b
     JOIN documents d ON d.booking_id = b.id
     WHERE d.status IN ('Pending','Rejected') AND b.expected_delivery_date <= CURDATE()`
  );
  const [paymentsToday] = await query(
    "SELECT COUNT(*) AS count FROM payments WHERE due_date = CURDATE() AND balance_amount > 0"
  );
  const [delayedToday] = await query(
    `SELECT COUNT(*) AS count
     FROM bookings
     WHERE shipment_status = 'Delayed'
        OR (expected_delivery_date < CURDATE() AND shipment_status NOT IN ('Delivered','Completed','Cancelled'))`
  );

  res.json({
    operations: {
      bookingsCreatedToday: toNumber(bookingsToday?.count),
      shipmentsExpectedToday: toNumber(expectedToday?.count),
      pickupsScheduledToday: toNumber(pickupsToday?.count),
      documentsPendingToday: toNumber(documentsToday?.count),
      paymentsDueToday: toNumber(paymentsToday?.count),
      delayedShipmentsToday: toNumber(delayedToday?.count)
    }
  });
});

const charts = asyncHandler(async (req, res) => {
  // Monthly Bookings - current year
  const monthlyBookings = await query(
    `SELECT DATE_FORMAT(booking_date, '%Y-%m') AS month, COUNT(*) AS count
     FROM bookings
     WHERE YEAR(booking_date) = YEAR(CURDATE())
     GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
     ORDER BY month ASC`
  );

  // Monthly Revenue - current year
  const monthlyRevenue = await query(
    `SELECT DATE_FORMAT(COALESCE(paid_at, payment_date), '%Y-%m') AS month, COALESCE(SUM(paid_amount), 0) AS amount
     FROM payments
     WHERE paid_amount > 0 AND (
       (paid_at IS NOT NULL AND YEAR(paid_at) = YEAR(CURDATE()))
       OR (paid_at IS NULL AND payment_date IS NOT NULL AND YEAR(payment_date) = YEAR(CURDATE()))
     )
     GROUP BY DATE_FORMAT(COALESCE(paid_at, payment_date), '%Y-%m')
     ORDER BY month ASC`
  );

  // Shipment Status distribution
  const shipmentStatus = await query(
    `SELECT COALESCE(NULLIF(current_status, ''), 'Unknown') AS status, COUNT(*) AS count
     FROM shipments
     GROUP BY COALESCE(NULLIF(current_status, ''), 'Unknown')
     ORDER BY count DESC`
  );

  // Document Status distribution
  const documentStatus = await query(
    `SELECT status, COUNT(*) AS count
     FROM documents
     GROUP BY status
     ORDER BY count DESC`
  );

  // Payment Status distribution
  const paymentStatus = await query(
    `SELECT COALESCE(NULLIF(payment_status, ''), 'Unknown') AS status, COUNT(*) AS count
     FROM payments
     GROUP BY COALESCE(NULLIF(payment_status, ''), 'Unknown')
     ORDER BY count DESC`
  );

  res.json({
    monthlyBookings: safeRows(monthlyBookings),
    monthlyRevenue: safeRows(monthlyRevenue),
    shipmentStatus: safeRows(shipmentStatus),
    documentStatus: safeRows(documentStatus),
    paymentStatus: safeRows(paymentStatus)
  });
});

module.exports = {
  summary,
  revenue,
  status,
  customerBusiness,
  delayedTrend,
  today,
  charts
};
