const axios = require('axios');
const { getDashboardSummary, getBookingContext } = require('./dashboardSummaryService');

function extractBookingId(message) {
  const match = String(message || '').match(/ORB-\d{4}-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

function extractAirportCodes(message) {
  const known = ['BOM', 'BLR', 'DEL', 'HYD', 'AMD', 'MAA', 'JAI', 'COK', 'CCU', 'PNQ', 'DXB', 'SIN', 'LHR', 'DOH', 'FRA', 'HKG', 'AMS', 'BKK', 'JED'];
  const text = String(message || '').toUpperCase();
  return known.filter((code) => new RegExp(`\\b${code}\\b`).test(text));
}

function compactContext(context) {
  return JSON.stringify(context, null, 2).slice(0, 6000);
}

async function callOllama(prompt) {
  if (!process.env.OLLAMA_BASE_URL) return null;
  try {
    const response = await axios.post(
      `${process.env.OLLAMA_BASE_URL.replace(/\/$/, '')}/api/generate`,
      {
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt,
        stream: false
      },
      { timeout: 20000 }
    );
    return response.data.response || null;
  } catch (error) {
    return null;
  }
}

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      { timeout: 20000 }
    );
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
}

function ruleBasedResponse(message, context) {
  const text = String(message || '').toLowerCase();
  const kpis = context.dashboard?.kpis || {};

  if (text.includes('chargeable weight')) {
    return 'Chargeable weight is the higher value between actual weight and volumetric weight. Volumetric weight = length x width x height x package count / 6000. Use the higher number for airline billing.';
  }

  if (text.includes('pending document') || text.includes('documents')) {
    const rows = context.dashboard?.tables?.pendingDocuments || [];
    if (!rows.length) return 'No pending document rows are visible for the current dashboard context.';
    return `Pending document attention is needed for ${rows.length} recent bookings. Start with ${rows
      .slice(0, 3)
      .map((row) => `${row.booking_id}: ${row.pending_documents}`)
      .join('; ')}.`;
  }

  if (text.includes('delayed') || text.includes('delay')) {
    const rows = context.dashboard?.tables?.delayedShipments || [];
    if (!rows.length) return 'No delayed shipments are visible in the current context.';
    return `Delayed shipment count is ${kpis.delayedShipments || rows.length}. Prioritize ${rows
      .slice(0, 3)
      .map((row) => `${row.booking_id} (${row.origin_airport}-${row.destination_airport})`)
      .join(', ')} and send customer updates after checking carrier status.`;
  }

  if (text.includes('customer update')) {
    const booking = context.booking?.booking;
    if (!booking) return 'Share the booking ID and I can draft a customer update using the shipment data.';
    return `Dear ${booking.customer_name}, your shipment ${booking.booking_id} is currently ${booking.shipment_status}. Our operations team is monitoring the ${booking.origin_airport}-${booking.destination_airport} movement and will update you at the next milestone.`;
  }

  if (text.includes('reminder')) {
    const booking = context.booking?.booking;
    if (!booking) return 'Share a booking ID and I can prepare a staff reminder.';
    return `Reminder: Please review ${booking.booking_id}, currently ${booking.shipment_status}, priority ${booking.priority}. Check pending documents, payment balance, and next shipment milestone today.`;
  }

  if (text.includes('weather') || text.includes('airspace') || text.includes('flight tracking')) {
    return 'Live weather, airspace, and flight-tracking APIs are not connected in this demo build. Use airline/carrier portals for live movement checks, then update ORBEM booking milestones and customer notes.';
  }

  return `Current dashboard summary: ${kpis.totalBookings || 0} bookings, ${kpis.completedShipments || 0} completed shipments, ${kpis.pendingDocuments || 0} bookings with pending documents, ${kpis.delayedShipments || 0} delayed shipments, and INR ${Number(kpis.pendingPayments || 0).toFixed(2)} pending payments. Recommended next step: clear document blockers first, then contact owners for delayed and high-priority bookings.`;
}

async function buildAssistantContext(message) {
  const context = {
    dashboard: await getDashboardSummary({})
  };

  const bookingId = extractBookingId(message);
  if (bookingId) {
    context.booking = await getBookingContext(bookingId);
  }

  const airportCodes = extractAirportCodes(message);
  if (airportCodes.length) {
    context.routeCodes = airportCodes;
  }

  return context;
}

async function generateAssistantReply(message, user) {
  const context = await buildAssistantContext(message);
  const prompt = `You are ORBEM Ops Assistant for ORBEM Solutions Private Limited.
Use internal operations data first. Be concise, practical, and do not invent live cargo rates.

User: ${user?.name || 'Operations user'} (${user?.role || 'Staff'})
Question: ${message}

Internal and optional live context:
${compactContext(context)}

Answer with clear operations next steps.`;

  const ollama = await callOllama(prompt);
  if (ollama) {
    return { reply: ollama.trim(), provider: 'ollama', context };
  }

  const gemini = await callGemini(prompt);
  if (gemini) {
    return { reply: gemini.trim(), provider: 'gemini', context };
  }

  return {
    reply: `AI API key not configured. Using local assistant mode.\n\n${ruleBasedResponse(message, context)}`,
    provider: 'rule-based',
    context
  };
}

module.exports = {
  generateAssistantReply
};
