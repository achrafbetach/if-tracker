import { PILOT_STATES } from '../../utils/constants';
import { fmtAlt, fmtSpeed, vsArrow, vsColor } from '../../utils/formatters';

export default function FlightsList({ flights, selectedFlight, onSelect, loading }) {
  return (
    <div className="flights-list">
      <div className="flights-list-header">
        <span>Flights</span>
        <span className="flights-count">{flights.length}</span>
      </div>

      <div className="flights-scroll">
        {loading && flights.length === 0 && (
          <div className="flights-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flight-row--skeleton" />
            ))}
          </div>
        )}

        {!loading && flights.length === 0 && (
          <div className="flights-empty">No flights found</div>
        )}

        {flights.map((flight) => {
          const isSelected = selectedFlight?.flightId === flight.flightId;
          const stateColor = PILOT_STATES[flight.pilotState]?.color ?? '#6b7280';
          const arrow = vsArrow(flight.verticalSpeed ?? 0);
          const arrowColor = vsColor(flight.verticalSpeed ?? 0);

          return (
            <div
              key={flight.flightId}
              className={`flight-row ${isSelected ? 'flight-row--selected' : ''}`}
              onClick={() => onSelect(flight)}
            >
              {/* State dot */}
              <div
                className="flight-dot"
                style={{ background: stateColor }}
                title={PILOT_STATES[flight.pilotState]?.label}
              />

              <div className="flight-info">
                <div className="flight-callsign">{flight.callsign || '—'}</div>
                {(flight.username || flight.virtualOrganization) && (
                  <div className="flight-meta">
                    {flight.virtualOrganization && (
                      <span className="flight-va">[{flight.virtualOrganization}]</span>
                    )}
                    {flight.username && (
                      <span className="flight-user">{flight.username}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flight-data">
                <div className="flight-alt">{fmtAlt(flight.altitude)}</div>
                <div className="flight-speed">
                  {fmtSpeed(flight.speed)}{' '}
                  <span style={{ color: arrowColor }}>{arrow}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
