const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      const error = new Error('Authentication token is required.');
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
    const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [decoded.id]);

    if (!users.length || !users[0].is_active) {
      const error = new Error('User account is not available.');
      error.statusCode = 401;
      throw error;
    }

    req.user = users[0];
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    error.message = error.message === 'jwt expired' ? 'Session expired. Please login again.' : error.message;
    next(error);
  }
}

module.exports = {
  protect
};
