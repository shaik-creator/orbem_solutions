const axios = require('axios');

async function sendToN8n(payload) {
  if (!process.env.N8N_WEBHOOK_URL) {
    return { sent: false, reason: 'N8N_WEBHOOK_URL is not configured.' };
  }

  try {
    await axios.post(process.env.N8N_WEBHOOK_URL, payload, { timeout: 7000 });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: 'n8n webhook did not accept the alert.' };
  }
}

module.exports = {
  sendToN8n
};
