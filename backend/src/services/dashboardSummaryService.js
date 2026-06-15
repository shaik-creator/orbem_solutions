const { query } = require('../config/db');

function firstRow(rows) {
  return Array.isArray(rows) && rows.length ? rows[0] : {};
}

function safeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function toNumber(value) {
  return Number(value || 0);
}

function buildBookingFilters(filters = {}, alias = 'b') {
  const where = [];
  const params = [];
  const field = (name) => `${alias}.${name}`;

  if (filters.dateFrom) {
    where.push(`${field('booking_date')} >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.push(`${field('booking_date')} <= ?`);
    params.push(filters.dateTo);
  }
  if (filters.status) {
    where.push(`${field('shipment_status')} = ?`);
    params.push(filters.status);
  }
  if (filters.customer) {
    where.push(`(${field('customer_name')} LIKE ? OR ${field('company_name')} LIKE ?)`);
    params.push(`%${filters.customer}%`, `%${filters.customer}%`);
  }
  if (filters.origin) {
    where.push(`${field('origin_airport')} = ?`);
    params.push(String(filters.origin).toUpperCase());
  }
  if (filters.destination) {
    where.push(`${field('destination_airport')} = ?`);
    params.push(String(filters.destination).toUpperCase());
  }
  if (filters.owner) {
    where.push(`${field('assigned_owner_id')} = ?`);
    params.push(Number(filters.owner));
  }

  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

async function getDashboardSummary(filters = {}) {
  const filter = buildBookingFilters(filters);
  const paymentJoin = `FROM bookings b LEFT JOIN payments p ON p.booking_id = b.id ${filter.sql}`;

  const bookingsCount = firstRow(await query(`SELECT COUNT(DISTINCT b.id) AS booking_count ${paymentJoin}`, filter.params));
  const completedCount = firstRow(await query(
    `SELECT COUNT(DISTINCT b.id) AS completed_count
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     ${filter.sql ? `${filter.sql} AND` : 'WHERE'} b.shipment_status IN ('Delivered','Completed')`,
    filter.params
  ));

  const pendingDocuments = firstRow(await query(
    `SELECT COUNT(DISTINCT b.id) AS pending_document_count
     FROM bookings b
     JOIN documents d ON d.booking_id = b.id
     ${filter.sql ? `${filter.sql} AND` : 'WHERE'} d.status IN ('Pending','Rejected')`,
    filter.params
  ));

  const delayed = firstRow(await query(
    `SELECT COUNT(DISTINCT b.id) AS delayed_count
     FROM bookings b
     ${filter.sql ? `${filter.sql} AND` : 'WHERE'}
     (b.shipment_status = 'Delayed' OR (b.expected_delivery_date < CURDATE() AND b.shipment_status NOT IN ('Delivered','Completed','Cancelled')))`,
    filter.params
  ));

  const revenue = firstRow(await query(
    `SELECT COALESCE(SUM(p.paid_amount), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN p.balance_amount > 0 THEN p.balance_amount ELSE 0 END), 0) AS pending_payment_amount
     ${paymentJoin}`,
    filter.params
  ));

  const customers = firstRow(await query(
    `SELECT COUNT(DISTINCT b.customer_id) AS customer_count FROM bookings b ${filter.sql}`,
    filter.params
  ));

  const complaints = firstRow(await query(
    "SELECT COUNT(*) AS open_complaint_count FROM complaints WHERE status IN ('Open','In Review')"
  ));

  const recentBookings = await query(
    `SELECT b.id, b.booking_id, b.customer_name, b.company_name, b.origin_airport, b.destination_airport,
            b.chargeable_weight, b.shipment_status, b.booking_date, b.expected_delivery_date, b.priority,
            u.name AS assigned_owner, p.payment_status
     FROM bookings b
     LEFT JOIN users u ON u.id = b.assigned_owner_id
     LEFT JOIN payments p ON p.booking_id = b.id
     ${filter.sql}
     ORDER BY b.booking_date DESC, b.id DESC
     LIMIT 8`,
    filter.params
  );

  const pendingDocumentRows = await query(
    `SELECT b.id, b.booking_id, b.customer_name, b.company_name,
            GROUP_CONCAT(d.document_type ORDER BY d.document_type SEPARATOR ', ') AS pending_documents
     FROM bookings b
     JOIN documents d ON d.booking_id = b.id
     ${filter.sql ? `${filter.sql} AND` : 'WHERE'} d.status IN ('Pending','Rejected')
     GROUP BY b.id
     ORDER BY b.expected_delivery_date ASC
     LIMIT 8`,
    filter.params
  );

  const delayedShipments = await query(
    `SELECT b.id, b.booking_id, b.customer_name, b.origin_airport, b.destination_airport,
            b.shipment_status, b.expected_delivery_date, u.name AS assigned_owner
     FROM bookings b
     LEFT JOIN users u ON u.id = b.assigned_owner_id
     ${filter.sql ? `${filter.sql} AND` : 'WHERE'}
     (b.shipment_status = 'Delayed' OR (b.expected_delivery_date < CURDATE() AND b.shipment_status NOT IN ('Delivered','Completed','Cancelled')))
     ORDER BY b.expected_delivery_date ASC
     LIMIT 8`,
    filter.params
  );

  const pendingPayments = await query(
    `SELECT b.id, b.booking_id, b.customer_name, p.invoice_amount, p.paid_amount,
            p.balance_amount, p.payment_status, p.due_date
     FROM bookings b
     JOIN payments p ON p.booking_id = b.id
     ${filter.sql ? `${filter.sql} AND` : 'WHERE'} p.balance_amount > 0
     ORDER BY p.due_date ASC
     LIMIT 8`,
    filter.params
  );

  const owners = await query("SELECT id, name, role FROM users WHERE is_active = 1 ORDER BY name ASC");

  return {
    kpis: {
      totalBookings: toNumber(bookingsCount.booking_count),
      completedShipments: toNumber(completedCount.completed_count),
      pendingDocuments: toNumber(pendingDocuments.pending_document_count),
      delayedShipments: toNumber(delayed.delayed_count),
      totalRevenue: toNumber(revenue.total_revenue),
      pendingPayments: toNumber(revenue.pending_payment_amount),
      activeCustomers: toNumber(customers.customer_count),
      openComplaints: toNumber(complaints.open_complaint_count)
    },
    tables: {
      recentBookings: safeRows(recentBookings),
      pendingDocuments: safeRows(pendingDocumentRows),
      delayedShipments: safeRows(delayedShipments),
      pendingPayments: safeRows(pendingPayments)
    },
    owners: safeRows(owners)
  };
}

async function getBookingContext(identifier) {
  const rows = await query(
    `SELECT b.*, u.name AS assigned_owner, p.invoice_amount, p.paid_amount, p.balance_amount, p.payment_status
     FROM bookings b
     LEFT JOIN users u ON u.id = b.assigned_owner_id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.booking_id = ? OR b.id = ?
     LIMIT 1`,
    [identifier, Number(identifier) || 0]
  );

  if (!rows.length) return null;

  const documents = await query(
    'SELECT document_type, status, remarks FROM documents WHERE booking_id = ? ORDER BY document_type',
    [rows[0].id]
  );
  const milestones = await query(
    'SELECT status, location, remarks, created_at FROM shipment_milestones WHERE booking_id = ? ORDER BY created_at ASC',
    [rows[0].id]
  );

  return {
    booking: rows[0],
    documents,
    milestones
  };
}

module.exports = {
  buildBookingFilters,
  getDashboardSummary,
  getBookingContext
};
