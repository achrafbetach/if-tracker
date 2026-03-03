import { useState, useEffect, useCallback } from 'react';
import Header from './components/UI/Header';
import ServerSelector from './components/UI/ServerSelector';
import MapView from './components/Map/MapView';
import FlightDetails from './components/Sidebar/FlightDetails';
import FlightsList from './components/Sidebar/FlightsList';
import AirportDetails from './components/Sidebar/AirportDetails';
import useSessions from './hooks/useSessions';
import useFlights from './hooks/useFlights';
import useFlightDetails from './hooks/useFlightDetails';
import useInactivityTimeout from './hooks/useInactivityTimeout';
import useAirports from './hooks/useAirports';
import useAllFlightPlans from './hooks/useAllFlightPlans';

export default function App() {
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedFlight,   setSelectedFlight]   = useState(null);
  const [selectedAirport,  setSelectedAirport]  = useState(null);
  const [showFlightsList,  setShowFlightsList]  = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');

  const { sessions, loading: sessionsLoading } = useSessions();
  const { isTimedOut, resetTimer } = useInactivityTimeout(15 * 60 * 1000);
  const { flights, atc, loading: flightsLoading, lastUpdate, refresh } = useFlights(
    selectedServerId,
    isTimedOut,
  );
  const { route, flightPlan, loading: detailsLoading } = useFlightDetails(
    selectedServerId,
    selectedFlight?.flightId,
  );
  const { airports } = useAirports();
  const { planCache, loadedCount: planLoadedCount, totalCount: planTotalCount } =
    useAllFlightPlans(selectedServerId, flights);

  /* ── Auto-select Expert server on load ── */
  useEffect(() => {
    if (!selectedServerId && sessions.length > 0) {
      const expert   = sessions.find((s) => s.worldType === 3);
      const fallback = sessions.find((s) => s.worldType > 0);
      const chosen   = expert ?? fallback;
      if (chosen) setSelectedServerId(chosen.id);
    }
  }, [sessions, selectedServerId]);

  /* ── Keep selected flight in sync with live refreshes ── */
  useEffect(() => {
    if (!selectedFlight) return;
    const updated = flights.find((f) => f.flightId === selectedFlight.flightId);
    if (updated) setSelectedFlight(updated);
    else setSelectedFlight(null); // flight landed / disconnected
  }, [flights]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers ── */
  const handleFlightClick = useCallback(
    (flight) => {
      setSelectedFlight(flight);
      setSelectedAirport(null);
      resetTimer();
    },
    [resetTimer],
  );

  const handleAirportClick = useCallback(
    (airport) => {
      setSelectedAirport(airport);
      setSelectedFlight(null);
      resetTimer();
    },
    [resetTimer],
  );

  const handleServerChange = useCallback(
    (id) => {
      setSelectedServerId(id);
      setSelectedFlight(null);
      setSelectedAirport(null);
      resetTimer();
    },
    [resetTimer],
  );

  const handleUserActivity = useCallback(() => {
    if (isTimedOut) return;
    resetTimer();
  }, [isTimedOut, resetTimer]);

  /* ── Filtered flights (search bar) ── */
  const filteredFlights = searchQuery
    ? flights.filter((f) => {
        const q = searchQuery.toLowerCase();
        return (
          f.callsign?.toLowerCase().includes(q) ||
          f.username?.toLowerCase().includes(q) ||
          f.virtualOrganization?.toLowerCase().includes(q)
        );
      })
    : flights;

  const currentSession = sessions.find((s) => s.id === selectedServerId);

  return (
    <div
      className="app"
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onKeyDown={handleUserActivity}
    >
      {/* ── Inactivity overlay ── */}
      {isTimedOut && (
        <div className="timeout-overlay">
          <div className="timeout-card">
            <div className="timeout-icon">✈</div>
            <h2 className="timeout-title">Tracking Paused</h2>
            <p className="timeout-desc">
              Live tracking stopped after 15 minutes of inactivity.
            </p>
            <button
              className="btn-primary"
              onClick={() => { resetTimer(); refresh(); }}
            >
              Resume Live Tracking
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <Header
        flightCount={flights.length}
        atcCount={atc.length}
        lastUpdate={lastUpdate}
        loading={flightsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleFlightsList={() => setShowFlightsList((v) => !v)}
        showFlightsList={showFlightsList}
        onRefresh={refresh}
      />

      {/* ── Body ── */}
      <div className="app-body">
        {/* Left sidebar */}
        <aside className="left-sidebar">
          <ServerSelector
            sessions={sessions}
            selectedServerId={selectedServerId}
            onSelect={handleServerChange}
            loading={sessionsLoading}
          />
          {showFlightsList && (
            <FlightsList
              flights={filteredFlights}
              selectedFlight={selectedFlight}
              onSelect={handleFlightClick}
              loading={flightsLoading}
            />
          )}
        </aside>

        {/* Map */}
        <MapView
          flights={filteredFlights}
          atc={atc}
          airports={airports}
          selectedFlight={selectedFlight}
          route={route}
          flightPlan={flightPlan}
          onFlightClick={handleFlightClick}
          onAirportClick={handleAirportClick}
        />

        {/* Right panel — flight details */}
        {selectedFlight && !selectedAirport && (
          <FlightDetails
            flight={selectedFlight}
            route={route}
            flightPlan={flightPlan}
            loading={detailsLoading}
            session={currentSession}
            onClose={() => setSelectedFlight(null)}
          />
        )}

        {/* Right panel — airport details with departures/arrivals */}
        {selectedAirport && (
          <AirportDetails
            airport={selectedAirport}
            atc={atc}
            flights={flights}
            flightPlanMap={planCache}
            planLoadedCount={planLoadedCount}
            planTotalCount={planTotalCount}
            onClose={() => setSelectedAirport(null)}
            onFlightClick={handleFlightClick}
          />
        )}
      </div>
    </div>
  );
}
