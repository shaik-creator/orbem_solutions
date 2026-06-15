const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { generateAssistantReply } = require('../services/aiService');
const { assertRequired } = require('../utils/validators');
const { logActivity } = require('../services/activityService');

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  assertRequired(req.body, ['message']);

  await query('INSERT INTO chat_messages (user_id, role, message, metadata) VALUES (?, ?, ?, JSON_OBJECT())', [
    req.user.id,
    'user',
    message
  ]);

  const result = await generateAssistantReply(message, req.user);
  await query(
    'INSERT INTO chat_messages (user_id, role, message, metadata) VALUES (?, ?, ?, ?)',
    [req.user.id, 'assistant', result.reply, JSON.stringify({ provider: result.provider })]
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
    `SELECT id, role, message, metadata, created_at
     FROM chat_messages
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
