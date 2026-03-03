import { X, Radio, Plane, MapPin, Box, TrendingDown, TrendingUp, Minus, Loader, Clock } from 'lucide-react';
import { haversineKm } from '../../utils/geo';
import { fmtAlt, fmtSpeed } from '../../utils/formatters';
import { ATC_TYPES } from '../../utils/constants';
import { IF_3D_AIRPORTS } from '../../utils/if3dAirports';

/**
 * Classify every active flight relative to an airport into 4 buckets:
 *
 *  arriving  — plan.dest === icao AND airborne
 *  departed  — plan.dep  === icao AND airborne
 *  taxiing   — on the ground at this airport AND plan.dep === icao (about to depart)
 *  onGround  — on the ground at this airport, no departure plan from here
 *
 * "On the ground" = alt < 300 ft AND within 8 km.
 * Airborne flights without a loaded plan are ignored for now.
 */
function classifyFlights(flights, airport, flightPlanMap) {
  const arriving = [];
  const departed = [];
  const taxiing  = [];
  const onGround = [];

  for (const f of flights) {
    const dist       = haversineKm(airport.lat, airport.lon, f.latitude, f.longitude);
    const alt        = f.altitude ?? 0;
    // "On ground" = within 8 km AND altitude within 500 ft above field elevation
    // (IF reports altitude as MSL, so we must account for airport elevation)
    const fieldElev  = airport.elevation ?? 0;
    const isOnGround = dist < 8 && alt < fieldElev + 500;
    const plan       = flightPlanMap?.get(f.flightId);
    const icao       = airport.icao;

    if (isOnGround) {
      if (plan?.dep === icao) {
        taxiing.push({ ...f, distKm: Math.round(dist) });
      } else {
        onGround.push({ ...f, distKm: Math.round(dist) });
      }
    } else {
      // Airborne — need a plan to know the relevance
      if (!plan) continue;
      if (plan.dest === icao) {
        arriving.push(f);
      } else if (plan.dep === icao) {
        departed.push(f);
      }
    }
  }

  return { arriving, departed, taxiing, onGround };
}

export default function AirportDetails({
  airport,
  atc,
  flights,
  flightPlanMap,
  planLoadedCount,
  planTotalCount,
  onClose,
  onFlightClick,
}) {
  const is3D      = airport.is3D ?? IF_3D_AIRPORTS.has(airport.icao);
  const activeAtc = atc.filter((f) => f.airportName === airport.icao);

  const { arriving, departed, taxiing, onGround } =
    classifyFlights(flights, airport, flightPlanMap);

  const plansLoading  = planTotalCount > 0 && planLoadedCount < planTotalCount;
  const planProgress  = planTotalCount > 0
    ? Math.round((planLoadedCount / planTotalCount) * 100)
    : 100;

  const totalFlights = arriving.length + departed.length + taxiing.length + onGround.length;

  return (
    <aside className="details-panel">
      {/* ── Header ── */}
      <div className="details-header">
        <div>
          <div className="airport-icao-row">
            <span className="airport-icao">{airport.icao}</span>
            {airport.iata && (
              <span className="airport-iata-badge">{airport.iata}</span>
            )}
            {is3D && (
              <span className="airport-3d-badge">
                <Box size={10} />
                3D
              </span>
            )}
          </div>
          <div className="airport-name" title={airport.name}>
            {airport.name && airport.name !== airport.icao
              ? airport.name
              : airport.icao}
          </div>
        </div>
        <button onClick={onClose} className="icon-btn">
          <X size={16} />
        </button>
      </div>

      {/* ── Location ── */}
      {(airport.city || airport.country) && (
        <div className="airport-meta">
          <MapPin size={11} />
          {[airport.city, airport.country].filter(Boolean).join(', ')}
        </div>
      )}

      {/* ── Flight plan loading progress ── */}
      {plansLoading && (
        <div className="plan-progress">
          <div className="plan-progress-header">
            <Loader size={11} className="plan-progress-spinner" />
            <span>Chargement des plans de vol…</span>
            <span className="plan-progress-pct">{planProgress}%</span>
          </div>
          <div className="plan-progress-bar">
            <div
              className="plan-progress-fill"
              style={{ width: `${planProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Summary badges ── */}
      <div className="airport-summary-badges">
        {activeAtc.length > 0 && (
          <span className="pill" style={{ background: '#a78bfa22', color: '#a78bfa', borderColor: '#a78bfa44' }}>
            <Radio size={10} /> {activeAtc.length} ATC
          </span>
        )}
        {arriving.length > 0 && (
          <span className="pill" style={{ background: '#3b82f622', color: '#3b82f6', borderColor: '#3b82f644' }}>
            <TrendingDown size={10} /> {arriving.length} arrivée{arriving.length > 1 ? 's' : ''}
          </span>
        )}
        {departed.length > 0 && (
          <span className="pill" style={{ background: '#10b98122', color: '#10b981', borderColor: '#10b98144' }}>
            <TrendingUp size={10} /> {departed.length} parti{departed.length > 1 ? 's' : ''}
          </span>
        )}
        {taxiing.length > 0 && (
          <span className="pill" style={{ background: '#f59e0b22', color: '#f59e0b', borderColor: '#f59e0b44' }}>
            <Clock size={10} /> {taxiing.length} départ{taxiing.length > 1 ? 's' : ''} prévu{taxiing.length > 1 ? 's' : ''}
          </span>
        )}
        {onGround.length > 0 && (
          <span className="pill" style={{ background: '#6b728022', color: '#9ca3af', borderColor: '#6b728044' }}>
            <Minus size={10} /> {onGround.length} au sol
          </span>
        )}
        {is3D && (
          <span className="pill" style={{ background: '#f59e0b18', color: '#f59e0b', borderColor: '#f59e0b44' }}>
            <Box size={10} /> Aéroport 3D
          </span>
        )}
      </div>

      {/* ── Active ATC ── */}
      {activeAtc.length > 0 && (
        <div className="details-section">
          <div className="details-section-title">
            <Radio size={12} /> Contrôle actif
          </div>
          <div className="atc-list">
            {activeAtc.map((f) => (
              <div key={f.frequencyId} className="atc-row">
                <span className="atc-type-badge">{ATC_TYPES[f.type] ?? 'ATC'}</span>
                {f.username && <span className="atc-controller">{f.username}</span>}
                {f.virtualOrganization && (
                  <span className="atc-va">[{f.virtualOrganization}]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Arriving (en route, destination = this airport) ── */}
      {arriving.length > 0 && (
        <FlightGroup
          title="En route vers cet aéroport"
          color="#3b82f6"
          icon={<TrendingDown size={12} />}
          flights={arriving}
          onFlightClick={onFlightClick}
        />
      )}

      {/* ── Taxiing / about to depart ── */}
      {taxiing.length > 0 && (
        <FlightGroup
          title="Sur le tarmac — départ prévu"
          color="#f59e0b"
          icon={<Clock size={12} />}
          flights={taxiing}
          onFlightClick={onFlightClick}
        />
      )}

      {/* ── Departed (airborne, departure = this airport) ── */}
      {departed.length > 0 && (
        <FlightGroup
          title="Décollés depuis cet aéroport"
          color="#10b981"
          icon={<TrendingUp size={12} />}
          flights={departed}
          onFlightClick={onFlightClick}
        />
      )}

      {/* ── On ground (no dep plan from here) ── */}
      {onGround.length > 0 && (
        <FlightGroup
          title="Au sol"
          color="#6b7280"
          icon={<Minus size={12} />}
          flights={onGround}
          onFlightClick={onFlightClick}
        />
      )}

      {/* ── Empty state ── */}
      {activeAtc.length === 0 && totalFlights === 0 && !plansLoading && (
        <div className="details-section">
          <div className="ap-empty-state">
            <Plane size={28} className="ap-empty-icon" />
            <span>Aucun vol détecté pour cet aéroport</span>
          </div>
        </div>
      )}

      {activeAtc.length === 0 && totalFlights === 0 && plansLoading && (
        <div className="details-section">
          <div className="ap-empty-state">
            <Loader size={22} className="ap-empty-icon plan-progress-spinner" />
            <span>Analyse des plans de vol en cours…</span>
          </div>
        </div>
      )}
    </aside>
  );
}

function FlightGroup({ title, color, icon, flights, onFlightClick }) {
  return (
    <div className="details-section">
      <div className="details-section-title" style={{ color }}>
        {icon}
        {title}
        <span
          className="pill pill--sm"
          style={{ marginLeft: 6, background: color + '22', color, borderColor: color + '44' }}
        >
          {flights.length}
        </span>
      </div>
      <div className="ap-flights-list">
        {flights.map((f) => (
          <div
            key={f.flightId}
            className="ap-flight-row"
            onClick={() => onFlightClick(f)}
          >
            <span className="ap-callsign">{f.callsign || '—'}</span>
            <span className="ap-stats">
              {fmtAlt(f.altitude)} · {fmtSpeed(f.speed)}
            </span>
            {f.distKm != null && (
              <span className="ap-dist">{f.distKm} km</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
