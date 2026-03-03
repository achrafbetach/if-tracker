import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      try {
        setLoading(true);
        const data = await api.getSessions();
        if (!cancelled) {
          // Filter out solo/private servers
          setSessions(data.filter((s) => s.worldType > 0 && s.worldType < 4));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSessions();
    // Sessions rarely change; refresh every 5 minutes
    const interval = setInterval(fetchSessions, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { sessions, loading, error };
}
