import { X, Navigation, Gauge, TrendingUp, Compass, Clock, Map, ExternalLink, Camera, PlaneTakeoff } from 'lucide-react';
import {
  fmtAlt, fmtSpeed, fmtVS, fmtHeading, fmtTime, vsArrow, vsColor,
} from '../../utils/formatters';
import { PILOT_STATES, WORLD_TYPES, FLIGHT_PLAN_TYPES } from '../../utils/constants';
import useAircraftPhoto from '../../hooks/useAircraftPhoto';

export default function FlightDetails({ flight, route, flightPlan, loading, onClose, session }) {
  const stateInfo  = PILOT_STATES[flight.pilotState] ?? { label: 'Unknown', color: '#6b7280' };
  const serverInfo = session ? WORLD_TYPES[session.worldType] : null;
  const vs = flight.verticalSpeed ?? 0;

  const { photo, loading: photoLoading, notFound: photoNotFound, iata } = useAircraftPhoto(flight.callsign);

  return (
    <aside className="details-panel">
      {/* ── Header ── */}
      <div className="details-header">
        <div className="details-callsign">{flight.callsign || '—'}</div>
        <button onClick={onClose} className="icon-btn"><X size={16} /></button>
      </div>

      {/* ── Aircraft photo ── */}
      <AircraftPhoto
        photo={photo}
        loading={photoLoading}
        notFound={photoNotFound}
        callsign={flight.callsign}
      />

      {/* ── Pilot + VA ── */}
      <div className="details-pilot">
        {flight.virtualOrganization && (
          <span className="pill pill--va">{flight.virtualOrganization}</span>
        )}
        {flight.username && (
          <span className="details-username">{flight.username}</span>
        )}
      </div>

      {/* ── Status badges ── */}
      <div className="details-badges">
        <span
          className="pill"
          style={{
            background: stateInfo.color + '22',
            color: stateInfo.color,
            borderColor: stateInfo.color + '55',
          }}
        >
          <span className="dot" style={{ background: stateInfo.color }} />
          {stateInfo.label}
        </span>
        {serverInfo && (
          <span
            className="pill"
            style={{
              background: serverInfo.bg + 'cc',
              color: serverInfo.color,
              borderColor: serverInfo.color + '44',
            }}
          >
            {serverInfo.label}
          </span>
        )}
        {iata && (
          <span className="pill" style={{ background: '#1e3a5f', color: '#93c5fd', borderColor: '#2d5a8f' }}>
            {iata}
          </span>
        )}
      </div>

      {/* ── Live stats grid ── */}
      <div className="details-stats">
        <StatCard icon={<Navigation size={14} />} label="Altitude"   value={fmtAlt(flight.altitude)} />
        <StatCard icon={<Gauge size={14} />}       label="Speed"      value={fmtSpeed(flight.speed)} />
        <StatCard
          icon={<TrendingUp size={14} />}
          label="Vert Speed"
          value={`${vsArrow(vs)} ${fmtVS(vs)}`}
          valueColor={vsColor(vs)}
        />
        <StatCard icon={<Compass size={14} />} label="Heading" value={fmtHeading(flight.heading)} />
      </div>

      {/* ── Position ── */}
      <div className="details-section">
        <div className="details-section-title"><Map size={12} /> Position</div>
        <div className="details-coords">
          {flight.latitude?.toFixed(4)}° N &nbsp;/&nbsp; {flight.longitude?.toFixed(4)}° E
        </div>
        <div className="details-lastupdate">Last report: {fmtTime(flight.lastReport)}</div>
      </div>

      {/* ── Route trail ── */}
      {route && route.length > 0 && (
        <div className="details-section">
          <div className="details-section-title"><Clock size={12} /> Route trail</div>
          <div className="route-stats">
            <span>{route.length} position reports</span>
            {route.length >= 2 && (
              <span>
                from {fmtTime(route[0].date)} to {fmtTime(route[route.length - 1].date)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Flight plan ── */}
      {flightPlan && (
        <div className="details-section">
          <div className="details-section-title">
            <Map size={12} /> Flight Plan
            <span className="pill pill--sm" style={{ marginLeft: 6 }}>
              {flightPlan.flightPlanType === 0 ? 'VFR' : 'IFR'}
            </span>
          </div>
          <WaypointList items={flightPlan.flightPlanItems} />
        </div>
      )}

      {loading && <div className="details-loading">Loading details…</div>}
    </aside>
  );
}

/* ── Aircraft photo block ── */
function AircraftPhoto({ photo, loading, notFound, callsign }) {
  if (loading) {
    return (
      <div className="ac-photo-wrap">
        <div className="ac-photo-skeleton" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="ac-photo-wrap">
        <div className="ac-photo-placeholder">
          <PlaneTakeoff size={40} className="ac-photo-placeholder-icon" />
          <span className="ac-photo-placeholder-text">
            {notFound ? 'Aucune photo disponible' : 'Recherche photo…'}
          </span>
        </div>
      </div>
    );
  }

  const imgSrc    = photo.thumbnail_large?.src ?? photo.thumbnail?.src;
  const model     = photo.aircraft?.model;
  const airline   = photo.airline?.name;
  const photoBy   = photo.photographer;
  const photoLink = photo.link;

  return (
    <div className="ac-photo-wrap">
      <a href={photoLink} target="_blank" rel="noopener noreferrer" className="ac-photo-link">
        <img
          src={imgSrc}
          alt={model ?? callsign}
          className="ac-photo-img"
          loading="lazy"
        />
        <div className="ac-photo-overlay">
          <ExternalLink size={12} />
          <span>View on Planespotters</span>
        </div>
      </a>

      <div className="ac-photo-meta">
        {model && <span className="ac-photo-model">{model}</span>}
        {airline && <span className="ac-photo-airline">{airline}</span>}
        {photoBy && (
          <span className="ac-photo-credit">
            <Camera size={10} /> {photoBy}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon, label, value, valueColor }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{icon} {label}</div>
      <div className="stat-card-value" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </div>
    </div>
  );
}

/* ── Waypoints ── */
function WaypointList({ items }) {
  if (!items || items.length === 0)
    return <div className="wp-empty">No waypoints filed</div>;

  return (
    <div className="wp-list">
      {flattenItems(items).map((wp, i) => (
        <div key={i} className="wp-row">
          <span className="wp-dot" />
          <span className="wp-name">{wp.name || wp.identifier || '?'}</span>
          {wp.type != null && (
            <span className="wp-type">{FLIGHT_PLAN_TYPES[wp.type] ?? ''}</span>
          )}
          {wp.altitude && wp.altitude > 0 && (
            <span className="wp-alt">{wp.altitude.toLocaleString()} ft</span>
          )}
        </div>
      ))}
    </div>
  );
}

function flattenItems(items) {
  const result = [];
  for (const item of items) {
    if (item.children?.length) {
      result.push(item);
      result.push(...flattenItems(item.children));
    } else {
      result.push(item);
    }
  }
  return result;
}
