// Infinite Flight Live API v2 service
// In dev: requests go through Vite proxy at /if-api (handles CORS + auth header)
// In prod: direct HTTPS with API key as query param

const IS_DEV = import.meta.env.DEV;
const API_KEY = import.meta.env.VITE_IF_API_KEY;

function buildUrl(endpoint) {
  if (IS_DEV) {
    // Vite proxy strips /if-api prefix and adds Authorization header
    return `/if-api${endpoint}`;
  }
  // Production: direct request with query param
  const sep = endpoint.includes('?') ? '&' : '?';
  return `https://api.infiniteflight.com/public/v2${endpoint}${sep}apikey=${API_KEY}`;
}

async function fetchIF(endpoint) {
  const url = buildUrl(endpoint);

  const opts = IS_DEV
    ? {} // proxy handles auth header
    : { headers: { Authorization: `Bearer ${API_KEY}` } };

  const res = await fetch(url, opts);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${endpoint}`);
  }

  const json = await res.json();

  if (json.errorCode !== 0) {
    throw new Error(`IF API error ${json.errorCode} on ${endpoint}`);
  }

  return json.result;
}

export const api = {
  getSessions: () => fetchIF('/sessions'),
  getFlights: (sessionId) => fetchIF(`/sessions/${sessionId}/flights`),
  getATC: (sessionId) => fetchIF(`/sessions/${sessionId}/atc`),
  getFlightRoute: (sessionId, flightId) =>
    fetchIF(`/sessions/${sessionId}/flights/${flightId}/route`),
  getFlightPlan: (sessionId, flightId) =>
    fetchIF(`/sessions/${sessionId}/flights/${flightId}/flightplan`),
};
