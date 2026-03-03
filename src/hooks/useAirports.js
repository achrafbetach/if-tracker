import { useState, useEffect } from 'react';

// mwgg/Airports — ~28 k airports, already JSON, no CSV parsing needed
const AIRPORTS_URL =
  'https://raw.githubusercontent.com/mwgg/Airports/master/airports.json';

// Module-level cache: survives React StrictMode double-mount
let moduleCache = null;

export default function useAirports() {
  const [airports, setAirports] = useState(moduleCache ?? []);
  const [loading, setLoading] = useState(moduleCache === null);

  useEffect(() => {
    if (moduleCache) return; // already loaded in a previous render cycle

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(AIRPORTS_URL);
        const json = await res.json();

        const list = Object.values(json)
          .filter(
            (a) =>
              a.icao?.length === 4 &&
              a.lat != null &&
              a.lon != null &&
              Math.abs(Number(a.lat)) <= 90 &&
              Math.abs(Number(a.lon)) <= 180,
          )
          .map((a) => ({
            icao: a.icao,
            iata: a.iata || '',
            name: a.name || a.icao,
            city: a.city || '',
            country: a.country || '',
            elevation: Number(a.elevation) || 0,
            lat: Number(a.lat),
            lon: Number(a.lon),
          }));

        moduleCache = list;
        if (!cancelled) {
          setAirports(list);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useAirports] fetch failed:', err);
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { airports, loading };
}
