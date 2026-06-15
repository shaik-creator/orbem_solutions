const axios = require('axios');
const { getDashboardSummary, getBookingContext } = require('./dashboardSummaryService');
const { getWeather, getWeatherForRoute } = require('./weatherService');
const { getRouteAirspaceContext } = require('./openSkyService');

function extractBookingId(message) {
  const match = String(message || '').match(/ORB-\d{4}-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

function extractAirportCodes(message) {
  const known = ['BOM', 'BLR', 'DEL', 'HYD', 'AMD', 'MAA', 'JAI', 'COK', 'CCU', 'PNQ', 'DXB', 'SIN', 'LHR', 'DOH', 'FRA', 'HKG', 'AMS', 'BKK', 'JED'];
  const text = String(message || '').toUpperCase();
  return known.filter((code) => new RegExp(`\\b${code}\\b`).test(text));
}

function wantsWeather(message) {
  return /weather|rain|wind|temperature|storm|risk/i.test(message);
}

function wantsAirspace(message) {
  return /opensky|airspace|air traffic|aircraft|flight context|live traffic/i.test(message);
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

  if (context.weather) {
    return `Weather context: ${JSON.stringify(context.weather)}. Use this as a risk signal only; confirm with airline operations before changing dispatch plans.`;
  }

  if (context.airspace) {
    return `Live airspace context: ${JSON.stringify(context.airspace)}. OpenSky can be unavailable or incomplete, so treat this as supporting context.`;
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
  if (wantsWeather(message)) {
    if (airportCodes.length >= 2) {
      context.weather = await getWeatherForRoute(airportCodes[0], airportCodes[1]);
    } else if (airportCodes.length === 1) {
      context.weather = await getWeather(airportCodes[0]);
    }
  }

  if (wantsAirspace(message)) {
    if (airportCodes.length >= 2) {
      context.airspace = await getRouteAirspaceContext(airportCodes[0], airportCodes[1]);
    } else if (context.booking?.booking) {
      context.airspace = await getRouteAirspaceContext(
        context.booking.booking.origin_airport,
        context.booking.booking.destination_airport
      );
    }
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
    reply: ruleBasedResponse(message, context),
    provider: 'rule-based',
    context
  };
}

module.exports = {
  generateAssistantReply
};
