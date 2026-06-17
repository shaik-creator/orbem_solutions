const axios = require('axios');
const { query } = require('../config/db');
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

function getGrokApiKey() {
  return process.env.GROK_API_KEY;
}

async function callGrok(prompt) {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return { reply: null, unavailableReason: 'missing-key' };
  }

  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: process.env.GROK_MODEL || 'grok-4.3',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are ORBEM Ops Assistant. Answer using the provided dashboard/database context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return {
      reply: response.data?.choices?.[0]?.message?.content || null,
      unavailableReason: null
    };
  } catch (error) {
    const providerMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      JSON.stringify(error.response?.data || {}) ||
      error.message;
    console.warn('Grok assistant request failed:', providerMessage);
    return { reply: null, unavailableReason: 'request-failed' };
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
  const dashboard = await getDashboardSummary({});
  const recentAlerts = await query(
    `SELECT title, message, type, severity, created_at
     FROM notifications
     ORDER BY created_at DESC, id DESC
     LIMIT 8`
  );

  const context = {
    dashboard,
    databaseContext: {
      totalBookings: dashboard.kpis.totalBookings,
      completedShipments: dashboard.kpis.completedShipments,
      pendingDocuments: dashboard.kpis.pendingDocuments,
      delayedShipments: dashboard.kpis.delayedShipments,
      pendingPayments: dashboard.kpis.pendingPayments,
      recentAlerts
    }
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
  const finalPrompt = `You are ORBEM Ops Assistant for ORBEM Solutions Private Limited.
Use internal operations data first. Be concise, practical, and do not invent live cargo rates.

User: ${user?.name || 'Operations user'} (${user?.role || 'Staff'})
Question: ${message}

Internal and optional live context:
${compactContext(context)}

Answer with clear operations next steps.`;

  const grok = await callGrok(finalPrompt);
  if (grok.reply) {
    return { reply: grok.reply.trim(), provider: 'grok', context };
  }

  const notice =
    grok.unavailableReason === 'missing-key'
      ? 'AI API key not configured. Using local assistant mode.'
      : 'Grok is unavailable right now. Using local assistant mode.';

  return {
    reply: `${notice}\n\n${ruleBasedResponse(message, context)}`,
    provider: 'rule-based',
    context
  };
}

module.exports = {
  generateAssistantReply
};
