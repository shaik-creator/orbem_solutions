const { query } = require('../config/db');

async function logActivity({
  userId,
  actionType = 'System',
  title,
  description,
  relatedType,
  relatedId
}) {
  if (!title) return null;
  try {
    await query(
      `INSERT INTO staff_activity (user_id, action, module, action_type, title, description, related_type, related_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        actionType,
        actionType,
        actionType,
        title,
        description || null,
        relatedType || null,
        relatedId || null
      ]
    );
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') {
      console.warn('Staff activity logging skipped:', error.message);
    }
  }

  try {
    const result = await query(
      `INSERT INTO activity_logs (user_id, action_type, title, description, related_type, related_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId || null, actionType, title, description || null, relatedType || null, relatedId || null]
    );
    return result.insertId;
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') {
      console.warn('Activity logging skipped:', error.message);
    }
    return null;
  }
}

module.exports = {
  logActivity
};
