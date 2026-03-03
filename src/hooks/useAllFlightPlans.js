import { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Module-level cache: persists across React StrictMode double-mounts.
 * Keyed by flightId → { dep: string|null, dest: string|null }
 */
const planCache  = new Map();
const fetchingSet = new Set();
let cachedSessionId = null;

const BATCH_SIZE  = 8;   // concurrent requests per batch
const BATCH_DELAY = 300; // ms between batches (avoid rate limiting)

/** Flatten nested flightPlanItems (children included). */
function flatItems(items = []) {
  return items.flatMap((it) => [it, ...flatItems(it.children ?? [])]);
}

/**
 * Extract the departure and destination airport ICAO codes from a flight plan.
 *
 * dep  strategy — top-level items only:
 *   Airport ICAOs are exactly 4 uppercase letters. Procedure names (SIDs, STARs,
 *   Approaches) tend to be longer ("OLKAN7N", "ILS27R"), so they are filtered out
 *   by the /^[A-Z]{4}$/ test. En-route waypoints at depth-0 also tend to be 5
 *   letters. This means the first top-level 4-letter item is almost always the
 *   departure airport — but only if the user explicitly added it (≥ 2 such items
 *   needed to safely distinguish dep from dest).
 *
 * dest strategy — all items (flattened):
 *   The destination is reliably the last 4-letter item in the full flattened list.
 */
function parseAirports(plan) {
  if (!plan?.flightPlanItems?.length) return { dep: null, dest: null };

  const items = plan.flightPlanItems;

  // Top-level scan for departure
  const topLevel = items
    .map((it) => (it.name ?? '').trim().toUpperCase())
    .filter((n) => /^[A-Z]{4}$/.test(n));

  // Full flattened scan for destination (most reliable at the end)
  const allFlat = flatItems(items)
    .map((it) => (it.name ?? '').trim().toUpperCase())
    .filter((n) => /^[A-Z]{4}$/.test(n));

  return {
    // Need ≥ 2 top-level airports to safely identify the first as the departure
    dep:  topLevel.length >= 2 ? topLevel[0] : null,
    dest: allFlat[allFlat.length - 1] ?? null,
  };
}

/**
 * Progressively fetches flight plans for every active flight in the session.
 * Plans are cached at module level — cached plans are never re-fetched unless
 * the session changes.
 *
 * Returns { planCache, loadedCount, totalCount }
 *   planCache  — Map<flightId, { dep, dest }>
 *   loadedCount — number of plans processed so far
 *   totalCount  — total flights to process
 */
export default function useAllFlightPlans(sessionId, flights) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount,  setTotalCount]  = useState(0);

  useEffect(() => {
    if (!sessionId || !flights?.length) return;

    // Clear cache when the session changes
    if (sessionId !== cachedSessionId) {
      planCache.clear();
      fetchingSet.clear();
      cachedSessionId = sessionId;
    }

    const toFetch = flights
      .map((f) => f.flightId)
      .filter((id) => !planCache.has(id) && !fetchingSet.has(id));

    setTotalCount(flights.length);
    setLoadedCount(planCache.size);

    if (!toFetch.length) return;

    let cancelled = false;
    let cursor    = 0;

    async function runBatch() {
      if (cancelled) return;

      const batch = toFetch.slice(cursor, cursor + BATCH_SIZE);
      if (!batch.length) return;
      cursor += BATCH_SIZE;

      // Mark as in-flight
      batch.forEach((id) => fetchingSet.add(id));

      await Promise.allSettled(
        batch.map(async (id) => {
          try {
            const plan = await api.getFlightPlan(sessionId, id);
            planCache.set(id, parseAirports(plan));
          } catch {
            // Flight has no plan or the request failed — store null values
            planCache.set(id, { dep: null, dest: null });
          } finally {
            fetchingSet.delete(id);
          }
        }),
      );

      if (!cancelled) setLoadedCount(planCache.size);

      if (cursor < toFetch.length && !cancelled) {
        setTimeout(runBatch, BATCH_DELAY);
      }
    }

    runBatch();
    return () => { cancelled = true; };
  }, [sessionId, flights]);

  return { planCache, loadedCount, totalCount };
}
