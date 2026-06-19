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
  port: Number(process.env.DB_PORT || 3306),
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
    return `Database "${process.env.DB_NAME || 'operations_dashboard'}" was not found. Create it and import backend/database/schema.sql, then backend/database/seed.sql.`;
  }

  if (codes.has('ER_NO_SUCH_TABLE')) {
    return 'Database tables are missing. Import backend/database/schema.sql, then backend/database/seed.sql.';
  }

  return `Database is unavailable. Start MySQL on ${process.env.DB_HOST || 'localhost'}:3306, then import backend/database/schema.sql and backend/database/seed.sql.`;
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

async function runMigrations() {
  try {
    // 1. Create revenue table if missing
    await query(`
      CREATE TABLE IF NOT EXISTS revenue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NULL,
        customer_id INT NULL,
        invoice_number VARCHAR(50) UNIQUE,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        payment_status ENUM('Paid','Pending','Partial','Overdue') DEFAULT 'Pending',
        due_date DATE NULL,
        paid_at DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_revenue_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        CONSTRAINT fk_revenue_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Add balance_amount column to revenue if missing
    const columns = await query("SHOW COLUMNS FROM revenue LIKE 'balance_amount'");
    if (columns.length === 0) {
      await query("ALTER TABLE revenue ADD COLUMN balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0");
    }

    // 3. Make sure payment_status enum is correct
    await query("ALTER TABLE revenue MODIFY COLUMN payment_status ENUM('Paid','Pending','Partial','Overdue') DEFAULT 'Pending'");

    // 4. Clean up payments table statuses and balances
    await query(`
      UPDATE payments
      SET
        balance_amount = GREATEST(invoice_amount - paid_amount, 0),
        payment_status = CASE
          WHEN GREATEST(invoice_amount - paid_amount, 0) <= 0 THEN 'Paid'
          WHEN GREATEST(invoice_amount - paid_amount, 0) > 0 AND due_date < CURDATE() THEN 'Overdue'
          WHEN GREATEST(invoice_amount - paid_amount, 0) > 0 AND paid_amount > 0 THEN 'Partial'
          ELSE 'Pending'
        END,
        paid_at = CASE
          WHEN GREATEST(invoice_amount - paid_amount, 0) <= 0 THEN COALESCE(paid_at, NOW())
          ELSE NULL
        END
    `);

    // 5. Clean up revenue table statuses and balances
    await query(`
      UPDATE revenue
      SET
        balance_amount = GREATEST(amount - paid_amount, 0),
        payment_status = CASE
          WHEN GREATEST(amount - paid_amount, 0) <= 0 THEN 'Paid'
          WHEN GREATEST(amount - paid_amount, 0) > 0 AND due_date < CURDATE() THEN 'Overdue'
          WHEN GREATEST(amount - paid_amount, 0) > 0 AND paid_amount > 0 THEN 'Partial'
          ELSE 'Pending'
        END,
        paid_at = CASE
          WHEN GREATEST(amount - paid_amount, 0) <= 0 THEN COALESCE(paid_at, NOW())
          ELSE NULL
        END
    `);
    
    console.log('Database migrations and data cleanup completed successfully.');
  } catch (error) {
    console.error('Failed to run database migrations:', error.message);
  }
}

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    await runMigrations();
    return true;
  } catch (error) {
    const setupError = normalizeDatabaseError(error);
    setupError.message = 'MySQL connection failed. Check backend/.env database settings.';
    throw setupError;
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
  testConnection,
  normalizeDatabaseError
};
