const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { PRIORITIES, assertDate, assertIn, assertRequired, createHttpError } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

const TASK_STATUSES = ['To Do', 'In Progress', 'Waiting', 'Completed'];

async function safeTaskQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return [];
    throw error;
  }
}

function validateTask(body, partial = false) {
  if (!partial) assertRequired(body, ['title']);
  if (body.priority) assertIn(body.priority, PRIORITIES, 'Priority');
  if (body.status) assertIn(body.status, TASK_STATUSES, 'Task status');
  assertDate(body.due_date, 'Due date');
}

const listTasks = asyncHandler(async (req, res) => {
  const rows = await safeTaskQuery(
    `SELECT t.*, u.name AS assigned_to_name, b.booking_id
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     LEFT JOIN bookings b ON b.id = t.related_booking_id
     ORDER BY FIELD(t.status, 'To Do','In Progress','Waiting','Completed'), t.due_date IS NULL, t.due_date ASC, t.id DESC`
  );
  res.json({ tasks: rows || [] });
});

const createTask = asyncHandler(async (req, res) => {
  validateTask(req.body);
  const result = await query(
    `INSERT INTO tasks (title, description, priority, assigned_to, due_date, status, related_booking_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.title.trim(),
      req.body.description || null,
      req.body.priority || 'Normal',
      req.body.assigned_to || null,
      req.body.due_date || null,
      req.body.status || 'To Do',
      req.body.related_booking_id || null,
      req.user.id
    ]
  );
  await logActivity({
    userId: req.user.id,
    actionType: 'Task',
    title: 'Task created',
    description: req.body.title,
    relatedType: 'task',
    relatedId: result.insertId
  });
  res.status(201).json({ message: 'Task created.', task: { id: result.insertId } });
});

const updateTask = asyncHandler(async (req, res) => {
  validateTask(req.body, true);
  const existing = await query('SELECT * FROM tasks WHERE id = ? LIMIT 1', [req.params.id]);
  if (!existing.length) throw createHttpError('Task not found.', 404);
  const current = existing[0];
  await query(
    `UPDATE tasks SET title = ?, description = ?, priority = ?, assigned_to = ?, due_date = ?, status = ?, related_booking_id = ?
     WHERE id = ?`,
    [
      req.body.title ?? current.title,
      req.body.description ?? current.description,
      req.body.priority ?? current.priority,
      req.body.assigned_to ?? current.assigned_to,
      req.body.due_date ?? current.due_date,
      req.body.status ?? current.status,
      req.body.related_booking_id ?? current.related_booking_id,
      req.params.id
    ]
  );
  await logActivity({
    userId: req.user.id,
    actionType: 'Task',
    title: 'Task updated',
    description: req.body.title || current.title,
    relatedType: 'task',
    relatedId: req.params.id
  });
  res.json({ message: 'Task updated.' });
});

const deleteTask = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw createHttpError('Task not found.', 404);
  await logActivity({
    userId: req.user.id,
    actionType: 'Task',
    title: 'Task deleted',
    relatedType: 'task',
    relatedId: req.params.id
  });
  res.json({ message: 'Task deleted.' });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  assertRequired(req.body, ['status']);
  assertIn(status, TASK_STATUSES, 'Task status');
  const result = await query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
  if (!result.affectedRows) throw createHttpError('Task not found.', 404);
  await logActivity({
    userId: req.user.id,
    actionType: 'Task',
    title: `Task moved to ${status}`,
    relatedType: 'task',
    relatedId: req.params.id
  });
  res.json({ message: 'Task status updated.' });
});

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus
};
