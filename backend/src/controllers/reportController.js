const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendCsv } = require('../utils/csvExport');

const bookingsCsv = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT b.booking_id, b.customer_name, b.company_name, b.origin_airport, b.destination_airport,
            b.cargo_type, b.package_count, b.actual_weight, b.chargeable_weight,
            b.shipment_status, b.booking_date, b.expected_delivery_date,
            u.name AS assigned_owner, b.priority
     FROM bookings b
     LEFT JOIN users u ON u.id = b.assigned_owner_id
     ORDER BY b.booking_date DESC`
  );
  sendCsv(res, 'bookings-report.csv', rows, [
    { key: 'booking_id', label: 'Booking ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'company_name', label: 'Company' },
    { key: 'origin_airport', label: 'Origin' },
    { key: 'destination_airport', label: 'Destination' },
    { key: 'cargo_type', label: 'Cargo Type' },
    { key: 'package_count', label: 'Packages' },
    { key: 'actual_weight', label: 'Actual Weight' },
    { key: 'chargeable_weight', label: 'Chargeable Weight' },
    { key: 'shipment_status', label: 'Shipment Status' },
    { key: 'booking_date', label: 'Booking Date' },
    { key: 'expected_delivery_date', label: 'Expected Delivery' },
    { key: 'assigned_owner', label: 'Assigned Owner' },
    { key: 'priority', label: 'Priority' }
  ]);
});

const revenueCsv = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT b.booking_id, b.customer_name, b.company_name, p.quotation_amount, p.invoice_amount,
            p.paid_amount, p.balance_amount, p.payment_status, p.payment_date, p.payment_method, p.due_date
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     ORDER BY p.due_date ASC`
  );
  sendCsv(res, 'revenue-report.csv', rows, [
    { key: 'booking_id', label: 'Booking ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'company_name', label: 'Company' },
    { key: 'quotation_amount', label: 'Quotation Amount' },
    { key: 'invoice_amount', label: 'Invoice Amount' },
    { key: 'paid_amount', label: 'Paid Amount' },
    { key: 'balance_amount', label: 'Balance Amount' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'payment_date', label: 'Payment Date' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'due_date', label: 'Due Date' }
  ]);
});

const pendingDocumentsCsv = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT b.booking_id, b.customer_name, b.company_name, b.shipment_status,
            d.document_type, d.status, d.remarks, d.updated_at
     FROM documents d
     JOIN bookings b ON b.id = d.booking_id
     WHERE d.status IN ('Pending','Rejected')
     ORDER BY b.expected_delivery_date ASC, d.document_type ASC`
  );
  sendCsv(res, 'pending-documents-report.csv', rows, [
    { key: 'booking_id', label: 'Booking ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'company_name', label: 'Company' },
    { key: 'shipment_status', label: 'Shipment Status' },
    { key: 'document_type', label: 'Document Type' },
    { key: 'status', label: 'Status' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'updated_at', label: 'Updated At' }
  ]);
});

const monthlySummary = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT DATE_FORMAT(b.booking_date, '%Y-%m') AS month,
            COUNT(*) AS total_bookings,
            SUM(CASE WHEN b.shipment_status IN ('Delivered','Completed') THEN 1 ELSE 0 END) AS completed_shipments,
            SUM(CASE WHEN b.shipment_status = 'Delayed' THEN 1 ELSE 0 END) AS delayed_shipments,
            COALESCE(SUM(p.invoice_amount), 0) AS invoiced,
            COALESCE(SUM(p.paid_amount), 0) AS received
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     GROUP BY DATE_FORMAT(b.booking_date, '%Y-%m')
     ORDER BY month DESC`
  );
  res.json({ summary: rows });
});

module.exports = {
  bookingsCsv,
  revenueCsv,
  pendingDocumentsCsv,
  monthlySummary
};
