const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertRequired, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

const listStaff = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT s.*, u.name, u.email, u.role, u.phone
     FROM staff s
     LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.is_active DESC, s.id DESC`
  );
  res.json({ staff: rows });
});

const createStaff = asyncHandler(async (req, res) => {
  assertRequired(req.body, ['user_id']);
  const result = await query(
    `INSERT INTO staff (user_id, department, position, salary, join_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.body.user_id,
      req.body.department || null,
      req.body.position || null,
      req.body.salary || null,
      req.body.join_date || null,
      req.body.is_active === undefined ? 1 : Number(req.body.is_active)
    ]
  );
  const rows = await query('SELECT * FROM staff WHERE id = ? LIMIT 1', [result.insertId]);
  await logActivity({
    userId: req.user.id,
    actionType: 'Staff',
    title: 'Staff record created',
    relatedType: 'staff',
    relatedId: result.insertId
  });
  res.status(201).json({ message: 'Staff record created.', staff: rows[0] });
});

const updateStaff = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM staff WHERE id = ? LIMIT 1', [req.params.id]);
  if (!rows.length) throw createHttpError('Staff record not found.', 404);
  const current = rows[0];
  await query(
    `UPDATE staff SET department = ?, position = ?, salary = ?, join_date = ?, is_active = ?
     WHERE id = ?`,
    [
      req.body.department ?? current.department,
      req.body.position ?? current.position,
      req.body.salary ?? current.salary,
      req.body.join_date ?? current.join_date,
      req.body.is_active === undefined ? current.is_active : Number(req.body.is_active),
      req.params.id
    ]
  );
  const updated = await query('SELECT * FROM staff WHERE id = ? LIMIT 1', [req.params.id]);
  await logActivity({
    userId: req.user.id,
    actionType: 'Staff',
    title: 'Staff record updated',
    relatedType: 'staff',
    relatedId: req.params.id
  });
  res.json({ message: 'Staff record updated.', staff: updated[0] });
});

const deleteStaff = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM staff WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw createHttpError('Staff record not found.', 404);
  await logActivity({
    userId: req.user.id,
    actionType: 'Staff',
    title: 'Staff record deleted',
    relatedType: 'staff',
    relatedId: req.params.id
  });
  res.json({ message: 'Staff record deleted.' });
});

const staffActivity = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT sa.*, u.name AS user_name, u.role AS user_role
     FROM staff_activity sa
     LEFT JOIN users u ON u.id = sa.user_id
     ORDER BY sa.created_at DESC, sa.id DESC
     LIMIT 100`
  );
  res.json({ activity: rows });
});

module.exports = {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  staffActivity
};
