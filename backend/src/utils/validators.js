const BOOKING_STATUSES = [
  'Booked',
  'Picked Up',
  'In Warehouse',
  'Documents Pending',
  'Ready for Dispatch',
  'In Transit',
  'Customs Hold',
  'Delivered',
  'Delayed',
  'Completed',
  'Cancelled'
];

const DOCUMENT_STATUSES = ['Pending', 'Received', 'Verified', 'Rejected'];
const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid', 'Overdue'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];
const ROLES = [
  'Admin / Owner',
  'Operations Staff',
  'Documentation Executive',
  'Warehouse Staff',
  'Accounts Staff',
  'Partner Manager'
];
const DOCUMENT_TYPES = [
  'Airway Bill',
  'Invoice',
  'Packing List',
  'ID Proof',
  'Cargo Declaration',
  'Customs Checklist',
  'Insurance Document',
  'Delivery Proof'
];

function createHttpError(message, statusCode = 400, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function assertRequired(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    throw createHttpError('Please fill all required fields.', 400, missing);
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function isPhone(value) {
  return /^[0-9+\-\s()]{7,20}$/.test(String(value || '').trim());
}

function assertEmail(value, label = 'Email') {
  if (!isEmail(value)) {
    throw createHttpError(`${label} is not valid.`);
  }
}

function assertPhone(value, label = 'Phone') {
  if (!isPhone(value)) {
    throw createHttpError(`${label} is not valid.`);
  }
}

function assertNonNegative(body, fields) {
  const invalid = fields.filter((field) => body[field] !== undefined && Number(body[field]) < 0);
  if (invalid.length) {
    throw createHttpError('Numeric fields cannot be negative.', 400, invalid);
  }
}

function assertIn(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw createHttpError(`${label} is not valid.`);
  }
}

function assertDate(value, label) {
  if (value && Number.isNaN(Date.parse(value))) {
    throw createHttpError(`${label} is not a valid date.`);
  }
}

function cleanAirport(value) {
  return String(value || '').trim().toUpperCase();
}

module.exports = {
  BOOKING_STATUSES,
  DOCUMENT_STATUSES,
  PAYMENT_STATUSES,
  PRIORITIES,
  ROLES,
  DOCUMENT_TYPES,
  createHttpError,
  assertRequired,
  assertEmail,
  assertPhone,
  assertNonNegative,
  assertIn,
  assertDate,
  cleanAirport
};
