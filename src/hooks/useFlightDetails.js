import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function useFlightDetails(sessionId, flightId) {
  const [route, setRoute] = useState([]);
  const [flightPlan, setFlightPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId || !flightId) {
      setRoute([]);
      setFlightPlan(null);
      return;
    }

    let cancelled = false;

    async function fetchDetails() {
      setLoading(true);
      try {
        const [routeData, planData] = await Promise.allSettled([
          api.getFlightRoute(sessionId, flightId),
          api.getFlightPlan(sessionId, flightId),
        ]);

        if (cancelled) return;

        setRoute(routeData.status === 'fulfilled' ? routeData.value : []);
        setFlightPlan(planData.status === 'fulfilled' ? planData.value : null);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetails();
    // Refresh route every 30s to update the trail
    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const routeData = await api.getFlightRoute(sessionId, flightId);
        if (!cancelled) setRoute(routeData);
      } catch {
        // silently ignore route refresh errors
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, flightId]);

  return { route, flightPlan, loading, error };
}
