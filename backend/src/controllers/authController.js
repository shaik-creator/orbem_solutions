const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertRequired, assertEmail, assertPhone, assertIn, ROLES, createHttpError } = require('../utils/validators');

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET || 'change_this_secret',
    { expiresIn: '8h' }
  );
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status_message: user.status_message || '',
    created_at: user.created_at || null,
    last_login_at: user.last_login_at || null,
    password_updated_at: user.password_updated_at || null
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'Operations Staff', phone } = req.body;
  assertRequired(req.body, ['name', 'email', 'password']);
  assertEmail(email);
  if (phone) assertPhone(phone);
  assertIn(role, ROLES, 'Role');

  if (String(password).length < 8) {
    throw createHttpError('Password must be at least 8 characters.');
  }

  const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) {
    throw createHttpError('A user with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), email.trim().toLowerCase(), passwordHash, role, phone || null]
  );

  const users = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  res.status(201).json({
    user: safeUser(users[0]),
    token: signToken(users[0])
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  assertRequired(req.body, ['email', 'password']);
  assertEmail(email);

  const users = await query('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [
    email.trim().toLowerCase()
  ]);
  if (!users.length) {
    throw createHttpError('Invalid email or password.', 401);
  }

  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw createHttpError('Invalid email or password.', 401);
  }

  try {
    await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    user.last_login_at = new Date().toISOString();
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
  }

  res.json({
    user: safeUser(user),
    token: signToken(user)
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: safeUser(req.user) });
});

module.exports = {
  register,
  login,
  me
};
