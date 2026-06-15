const axios = require('axios');

const cache = new Map();
const TEN_MINUTES = 10 * 60 * 1000;

const AIRPORT_COORDS = {
  BOM: { name: 'Mumbai', latitude: 19.0896, longitude: 72.8656 },
  BLR: { name: 'Bengaluru', latitude: 13.1986, longitude: 77.7066 },
  DEL: { name: 'Delhi', latitude: 28.5562, longitude: 77.1 },
  HYD: { name: 'Hyderabad', latitude: 17.2403, longitude: 78.4294 },
  AMD: { name: 'Ahmedabad', latitude: 23.0732, longitude: 72.6266 },
  MAA: { name: 'Chennai', latitude: 12.9941, longitude: 80.1709 },
  JAI: { name: 'Jaipur', latitude: 26.8242, longitude: 75.8122 },
  COK: { name: 'Kochi', latitude: 10.152, longitude: 76.4019 },
  CCU: { name: 'Kolkata', latitude: 22.6547, longitude: 88.4467 },
  PNQ: { name: 'Pune', latitude: 18.5793, longitude: 73.9089 },
  DXB: { name: 'Dubai', latitude: 25.2532, longitude: 55.3657 },
  SIN: { name: 'Singapore', latitude: 1.3644, longitude: 103.9915 },
  LHR: { name: 'London Heathrow', latitude: 51.47, longitude: -0.4543 },
  DOH: { name: 'Doha', latitude: 25.2731, longitude: 51.6081 },
  FRA: { name: 'Frankfurt', latitude: 50.0379, longitude: 8.5622 },
  HKG: { name: 'Hong Kong', latitude: 22.308, longitude: 113.9185 },
  AMS: { name: 'Amsterdam', latitude: 52.3105, longitude: 4.7683 },
  BKK: { name: 'Bangkok', latitude: 13.69, longitude: 100.7501 },
  JED: { name: 'Jeddah', latitude: 21.6702, longitude: 39.1528 }
};

function cacheGet(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.createdAt < TEN_MINUTES) {
    return entry.value;
  }
  return null;
}

function cacheSet(key, value) {
  cache.set(key, { value, createdAt: Date.now() });
}

async function geocodeLocation(query) {
  const code = String(query || '').trim().toUpperCase();
  if (AIRPORT_COORDS[code]) {
    return { code, ...AIRPORT_COORDS[code] };
  }

  const cacheKey = `geo:${code}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'ORBEM-Operations-Dashboard/1.0' },
    timeout: 7000
  });

  if (!response.data.length) {
    return null;
  }

  const result = {
    code,
    name: response.data[0].display_name,
    latitude: Number(response.data[0].lat),
    longitude: Number(response.data[0].lon)
  };
  cacheSet(cacheKey, result);
  return result;
}

function describeWeatherRisk(current) {
  const wind = Number(current.wind_speed_10m || 0);
  const rain = Number(current.rain || 0);
  const visibilityNote = current.weather_code >= 45 && current.weather_code <= 75;

  if (wind >= 45 || rain >= 8 || visibilityNote) {
    return 'High weather attention needed';
  }
  if (wind >= 28 || rain >= 2) {
    return 'Moderate weather watch';
  }
  return 'Low immediate weather risk';
}

async function getWeather(location) {
  const geo = await geocodeLocation(location);
  if (!geo) {
    return { available: false, message: 'Live data unavailable for that location.' };
  }

  const cacheKey = `weather:${geo.latitude}:${geo.longitude}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: geo.latitude,
        longitude: geo.longitude,
        current: 'temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m',
        timezone: 'auto'
      },
      timeout: 7000
    });

    const current = response.data.current || {};
    const value = {
      available: true,
      location: geo.name,
      airport: geo.code,
      current,
      risk: describeWeatherRisk(current),
      source: 'Open-Meteo'
    };
    cacheSet(cacheKey, value);
    return value;
  } catch (error) {
    return { available: false, message: 'Live data unavailable.' };
  }
}

async function getWeatherForRoute(origin, destination) {
  const [originWeather, destinationWeather] = await Promise.all([
    getWeather(origin),
    getWeather(destination)
  ]);

  return {
    origin: originWeather,
    destination: destinationWeather
  };
}

module.exports = {
  AIRPORT_COORDS,
  getWeather,
  getWeatherForRoute
};
