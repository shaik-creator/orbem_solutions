const axios = require('axios');
const { AIRPORT_COORDS } = require('./weatherService');

const cache = new Map();
const FIVE_MINUTES = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.createdAt < FIVE_MINUTES) {
    return entry.value;
  }
  return null;
}

function setCached(key, value) {
  cache.set(key, { value, createdAt: Date.now() });
}

function bboxForAirport(code) {
  const airport = AIRPORT_COORDS[String(code || '').trim().toUpperCase()];
  if (!airport) return null;
  return {
    lamin: airport.latitude - 2,
    lamax: airport.latitude + 2,
    lomin: airport.longitude - 2,
    lomax: airport.longitude + 2
  };
}

async function getAirspaceNearAirport(code) {
  const bbox = bboxForAirport(code);
  if (!bbox) {
    return { available: false, airport: code, message: 'Airport location is not mapped.' };
  }

  const key = `opensky:${String(code).toUpperCase()}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const response = await axios.get('https://opensky-network.org/api/states/all', {
      params: bbox,
      timeout: 8000
    });
    const states = response.data.states || [];
    const value = {
      available: true,
      airport: String(code).toUpperCase(),
      aircraftCount: states.length,
      sample: states.slice(0, 5).map((state) => ({
        callsign: String(state[1] || '').trim() || 'Unknown',
        originCountry: state[2],
        altitude: state[7],
        velocity: state[9]
      })),
      source: 'OpenSky Network'
    };
    setCached(key, value);
    return value;
  } catch (error) {
    return {
      available: false,
      airport: String(code || '').toUpperCase(),
      message: 'Live airspace data unavailable.'
    };
  }
}

async function getRouteAirspaceContext(origin, destination) {
  const [originAirspace, destinationAirspace] = await Promise.all([
    getAirspaceNearAirport(origin),
    getAirspaceNearAirport(destination)
  ]);
  return { origin: originAirspace, destination: destinationAirspace };
}

module.exports = {
  getAirspaceNearAirport,
  getRouteAirspaceContext
};
