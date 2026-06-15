const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendCsv, toCsv } = require('../utils/csvExport');
const {
  assertRequired,
  assertNonNegative,
  assertDate,
  cleanAirport,
  createHttpError
} = require('../utils/validators');

const RATE_FIELDS = [
  'airline_name',
  'origin_airport',
  'destination_airport',
  'rate_per_kg',
  'fuel_surcharge',
  'handling_charge',
  'valid_from',
  'valid_to',
  'notes'
];

function validateRate(body, partial = false) {
  if (!partial) {
    assertRequired(body, ['airline_name', 'origin_airport', 'destination_airport', 'rate_per_kg', 'valid_from', 'valid_to']);
  }
  assertNonNegative(body, ['rate_per_kg', 'fuel_surcharge', 'handling_charge']);
  assertDate(body.valid_from, 'Valid from');
  assertDate(body.valid_to, 'Valid to');
  if (body.valid_from && body.valid_to && new Date(body.valid_to) < new Date(body.valid_from)) {
    throw createHttpError('Valid to date cannot be before valid from date.');
  }
}

function normalizeRate(body, existing = {}) {
  const payload = { ...existing };
  for (const field of RATE_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  payload.origin_airport = cleanAirport(payload.origin_airport);
  payload.destination_airport = cleanAirport(payload.destination_airport);
  payload.fuel_surcharge = Number(payload.fuel_surcharge || 0);
  payload.handling_charge = Number(payload.handling_charge || 0);
  payload.rate_per_kg = Number(payload.rate_per_kg || 0);
  return payload;
}

const listRates = asyncHandler(async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.origin) {
    where.push('origin_airport = ?');
    params.push(cleanAirport(req.query.origin));
  }
  if (req.query.destination) {
    where.push('destination_airport = ?');
    params.push(cleanAirport(req.query.destination));
  }
  const rows = await query(
    `SELECT * FROM airline_rates ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY valid_to DESC, airline_name ASC`,
    params
  );
  res.json({ rates: rows });
});

const createRate = asyncHandler(async (req, res) => {
  validateRate(req.body);
  const payload = normalizeRate(req.body);
  const result = await query(
    `INSERT INTO airline_rates
     (airline_name, origin_airport, destination_airport, rate_per_kg, fuel_surcharge, handling_charge, valid_from, valid_to, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.airline_name,
      payload.origin_airport,
      payload.destination_airport,
      payload.rate_per_kg,
      payload.fuel_surcharge,
      payload.handling_charge,
      payload.valid_from,
      payload.valid_to,
      payload.notes || null
    ]
  );
  res.status(201).json({ message: 'Airline rate created successfully.', id: result.insertId });
});

const updateRate = asyncHandler(async (req, res) => {
  validateRate(req.body, true);
  const rows = await query('SELECT * FROM airline_rates WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw createHttpError('Airline rate not found.', 404);
  const payload = normalizeRate(req.body, rows[0]);

  await query(
    `UPDATE airline_rates SET airline_name = ?, origin_airport = ?, destination_airport = ?,
      rate_per_kg = ?, fuel_surcharge = ?, handling_charge = ?, valid_from = ?, valid_to = ?, notes = ?
     WHERE id = ?`,
    [
      payload.airline_name,
      payload.origin_airport,
      payload.destination_airport,
      payload.rate_per_kg,
      payload.fuel_surcharge,
      payload.handling_charge,
      payload.valid_from,
      payload.valid_to,
      payload.notes || null,
      req.params.id
    ]
  );
  res.json({ message: 'Airline rate updated successfully.' });
});

const deleteRate = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM airline_rates WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw createHttpError('Airline rate not found.', 404);
  res.json({ message: 'Airline rate deleted successfully.' });
});

const compareRates = asyncHandler(async (req, res) => {
  assertRequired(req.query, ['origin', 'destination']);
  const weight = Number(req.query.weight || 1);
  if (weight <= 0) throw createHttpError('Weight must be greater than zero.');

  const rows = await query(
    `SELECT *, ((rate_per_kg + fuel_surcharge) * ? + handling_charge) AS total_cost
     FROM airline_rates
     WHERE origin_airport = ? AND destination_airport = ?
       AND CURDATE() BETWEEN valid_from AND valid_to
     ORDER BY total_cost ASC`,
    [weight, cleanAirport(req.query.origin), cleanAirport(req.query.destination)]
  );

  res.json({
    weight,
    cheapest: rows[0] || null,
    rates: rows
  });
});

function parseCsv(text) {
  const lines = String(text || '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] || '';
      return row;
    }, {});
  });
}

const importRates = asyncHandler(async (req, res) => {
  assertRequired(req.body, ['csvText']);
  const rows = parseCsv(req.body.csvText);
  let imported = 0;

  for (const row of rows) {
    validateRate(row);
    const payload = normalizeRate(row);
    await query(
      `INSERT INTO airline_rates
       (airline_name, origin_airport, destination_airport, rate_per_kg, fuel_surcharge, handling_charge, valid_from, valid_to, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.airline_name,
        payload.origin_airport,
        payload.destination_airport,
        payload.rate_per_kg,
        payload.fuel_surcharge,
        payload.handling_charge,
        payload.valid_from,
        payload.valid_to,
        payload.notes || null
      ]
    );
    imported += 1;
  }

  res.json({ message: `${imported} rates imported.`, imported });
});

const exportRates = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM airline_rates ORDER BY airline_name ASC');
  sendCsv(res, 'airline-rates.csv', rows, [
    { key: 'airline_name', label: 'airline_name' },
    { key: 'origin_airport', label: 'origin_airport' },
    { key: 'destination_airport', label: 'destination_airport' },
    { key: 'rate_per_kg', label: 'rate_per_kg' },
    { key: 'fuel_surcharge', label: 'fuel_surcharge' },
    { key: 'handling_charge', label: 'handling_charge' },
    { key: 'valid_from', label: 'valid_from' },
    { key: 'valid_to', label: 'valid_to' },
    { key: 'notes', label: 'notes' }
  ]);
});

module.exports = {
  listRates,
  createRate,
  updateRate,
  deleteRate,
  compareRates,
  importRates,
  exportRates,
  parseCsv,
  toCsv
};
