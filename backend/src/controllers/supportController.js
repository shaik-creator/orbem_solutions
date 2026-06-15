const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertIn, assertRequired, createHttpError } = require('../utils/validators');

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const createTicket = asyncHandler(async (req, res) => {
  const { title, module, description, priority = 'Medium' } = req.body;
  assertRequired(req.body, ['title', 'description']);
  assertIn(priority, PRIORITIES, 'Priority');

  const cleanTitle = String(title).trim();
  const cleanDescription = String(description).trim();
  if (cleanTitle.length > 150) throw createHttpError('Issue title is too long.', 400);
  if (cleanDescription.length > 4000) throw createHttpError('Description is too long.', 400);

  const result = await query(
    `INSERT INTO support_tickets (user_id, title, module, description, priority)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, cleanTitle, String(module || '').trim() || null, cleanDescription, priority]
  );

  const rows = await query(
    `SELECT st.*, u.name AS user_name, u.email AS user_email
     FROM support_tickets st
     LEFT JOIN users u ON u.id = st.user_id
     WHERE st.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ message: 'Support ticket submitted.', ticket: rows[0] });
});

const listTickets = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT st.id, st.title, st.module, st.priority, st.status, st.created_at, st.updated_at,
            u.name AS user_name, u.email AS user_email
     FROM support_tickets st
     LEFT JOIN users u ON u.id = st.user_id
     ORDER BY st.created_at DESC, st.id DESC
     LIMIT 200`
  );
  res.json({ tickets: rows });
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  assertIn(status, STATUSES, 'Status');

  const result = await query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, req.params.id]);
  if (!result.affectedRows) throw createHttpError('Support ticket not found.', 404);

  res.json({ message: 'Support ticket status updated.' });
});

module.exports = {
  createTicket,
  listTickets,
  updateTicketStatus
};
