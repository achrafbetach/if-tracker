import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

const POLL_INTERVAL = 15_000; // 15 seconds

export default function useFlights(sessionId, paused = false) {
  const [flights, setFlights] = useState([]);
  const [atc, setAtc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!sessionId || paused) return;

    try {
      setLoading(true);
      const [flightData, atcData] = await Promise.all([
        api.getFlights(sessionId),
        api.getATC(sessionId),
      ]);
      setFlights(flightData);
      setAtc(atcData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, paused]);

  // Reset and re-fetch when sessionId changes
  useEffect(() => {
    setFlights([]);
    setAtc([]);
    setLastUpdate(null);
    fetchData();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 15s (skip when paused)
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!paused) {
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    }
    return () => clearInterval(intervalRef.current);
  }, [fetchData, paused]);

  return { flights, atc, loading, error, lastUpdate, refresh: fetchData };
}
