const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_SETUP_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_NO_SUCH_TABLE'
]);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'operations_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  timezone: 'Z',
  decimalNumbers: true
});

function flattenDatabaseErrors(error) {
  const errors = [];
  const visit = (item) => {
    if (!item || errors.includes(item)) return;
    errors.push(item);
    if (Array.isArray(item.errors)) item.errors.forEach(visit);
    if (item.cause) visit(item.cause);
  };
  visit(error);
  return errors;
}

function isDatabaseSetupError(error) {
  return flattenDatabaseErrors(error).some((item) => DB_SETUP_ERROR_CODES.has(item.code));
}

function getDatabaseSetupMessage(error) {
  const errors = flattenDatabaseErrors(error);
  const codes = new Set(errors.map((item) => item.code).filter(Boolean));

  if (codes.has('ER_ACCESS_DENIED_ERROR')) {
    return 'Database login failed. Check DB_USER and DB_PASSWORD in backend/.env.';
  }

  if (codes.has('ER_BAD_DB_ERROR')) {
    return `Database "${process.env.DB_NAME || 'operations_dashboard'}" was not found. Create it and import backend/src/database/schema.sql, then backend/src/database/seed.sql.`;
  }

  if (codes.has('ER_NO_SUCH_TABLE')) {
    return 'Database tables are missing. Import backend/src/database/schema.sql, then backend/src/database/seed.sql.';
  }

  return `Database is unavailable. Start MySQL on ${process.env.DB_HOST || 'localhost'}:3306, then import backend/src/database/schema.sql and backend/src/database/seed.sql.`;
}

function normalizeDatabaseError(error) {
  if (!isDatabaseSetupError(error)) return error;

  const setupError = new Error(getDatabaseSetupMessage(error));
  setupError.statusCode = 503;
  setupError.code = 'DATABASE_UNAVAILABLE';
  setupError.cause = error;
  setupError.details = flattenDatabaseErrors(error)
    .map((item) => ({
      code: item.code,
      message: item.message,
      address: item.address,
      port: item.port
    }))
    .filter((item) => item.code || item.message);
  return setupError;
}

async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

async function transaction(callback) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) await connection.rollback();
    throw normalizeDatabaseError(error);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  normalizeDatabaseError
};
