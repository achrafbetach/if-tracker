export const WORLD_TYPES = {
  1: { label: 'Casual', short: 'CAS', color: '#f59e0b', bg: '#78350f' },
  2: { label: 'Training', short: 'TRN', color: '#3b82f6', bg: '#1e3a5f' },
  3: { label: 'Expert', short: 'EXP', color: '#10b981', bg: '#064e3b' },
};

export const PILOT_STATES = {
  0: { label: 'Active', color: '#00d4ff' },
  1: { label: 'Away (In Flight)', color: '#f59e0b' },
  2: { label: 'Away (Parked)', color: '#6b7280' },
  3: { label: 'Background', color: '#374151' },
};

export const ATC_TYPES = {
  0: 'Ground',
  1: 'Tower',
  2: 'Unicom',
  3: 'Clearance Delivery',
  4: 'Approach',
  5: 'Departure',
  6: 'Center',
  7: 'ATIS',
  8: 'Recorded ATIS',
  9: 'Unknown',
};

export const FLIGHT_PLAN_TYPES = {
  0: 'SID',
  1: 'STAR',
  2: 'Approach',
  3: 'Track',
  5: 'Waypoint',
};

export const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const POLL_INTERVAL_MS = 15_000;
