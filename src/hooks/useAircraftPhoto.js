import { useState, useEffect } from 'react';
import { parseIataFromCallsign } from '../utils/aircraftUtils';
 
const BASE = 'https://api.planespotters.net/pub/photos';
 
// Module-level cache: keyed by IATA code to avoid duplicate fetches
const cache = new Map();
 
/**
 * Fetches a real aircraft photo from Planespotters.net based on the callsign.
 * Supports both ICAO-prefix callsigns ("RAM752") and full-name callsigns
 * ("Royal Air Maroc 752").
 * Returns { photo, loading, iata, notFound }.
 *
 * photo object (from Planespotters):
 *   { thumbnail_large.src, link, photographer, aircraft.model, airline.name }
 */
export default function useAircraftPhoto(callsign) {
  const iata = parseIataFromCallsign(callsign);
 
  const [photo,    setPhoto]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [notFound, setNotFound] = useState(false);
 
  useEffect(() => {
    setNotFound(false);
 
    if (!iata) {
      setPhoto(null);
      setLoading(false);
      return;
    }
 
    // Serve from cache instantly
    if (cache.has(iata)) {
      const cached = cache.get(iata);
      setPhoto(cached);
      setNotFound(cached === null);
      setLoading(false);
      return;
    }
 
    let cancelled = false;
    setLoading(true);
    setPhoto(null);
 
    async function fetchPhoto() {
      try {
        const res = await fetch(`${BASE}/operator/${iata}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const p = data.photos?.[0] ?? null;
        cache.set(iata, p);
        if (!cancelled) {
          setPhoto(p);
          setNotFound(p === null);
          setLoading(false);
        }
      } catch {
        cache.set(iata, null);
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }
 
    fetchPhoto();
    return () => { cancelled = true; };
  }, [iata]);
 
  return { photo, loading, notFound, iata };
}