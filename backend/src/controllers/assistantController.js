const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { generateAssistantReply } = require('../services/aiService');
const { assertRequired } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  assertRequired(req.body, ['message']);

  // Store user message
  await query(
    'INSERT INTO assistant_messages (user_id, role, message) VALUES (?, ?, ?)',
    [req.user.id, 'user', message]
  );

  // Generate assistant reply based on database context
  const result = await generateAssistantReply(message, req.user);
  
  // Store assistant message
  await query(
    'INSERT INTO assistant_messages (user_id, role, message) VALUES (?, ?, ?)',
    [req.user.id, 'assistant', result.reply]
  );

  await logActivity({
    userId: req.user.id,
    actionType: 'Assistant',
    title: 'Assistant used',
    description: String(message).slice(0, 180),
    relatedType: 'assistant'
  });

  res.json({
    reply: result.reply,
    provider: result.provider
  });
});

const history = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, role, message, created_at
     FROM assistant_messages
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 40`,
    [req.user.id]
  );
  res.json({ messages: rows.reverse() });
});

module.exports = {
  chat,
  history
};
