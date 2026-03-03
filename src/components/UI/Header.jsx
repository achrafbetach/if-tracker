import { Search, RefreshCw, List, Wifi } from 'lucide-react';
import { fmtRelativeTime } from '../../utils/formatters';

export default function Header({
  flightCount,
  atcCount,
  lastUpdate,
  loading,
  searchQuery,
  onSearchChange,
  onToggleFlightsList,
  onRefresh,
  showFlightsList,
}) {
  return (
    <header className="header">
      {/* Brand */}
      <div className="header-brand">
        <span className="header-logo">✈</span>
        <div>
          <div className="header-title">IF Live Tracker</div>
          <div className="header-subtitle">Infinite Flight</div>
        </div>
      </div>

      {/* Stats */}
      <div className="header-stats">
        <StatBadge
          icon="✈"
          value={flightCount?.toLocaleString() ?? '—'}
          label="Flights"
          color="#00d4ff"
        />
        <StatBadge
          icon="🗼"
          value={atcCount?.toLocaleString() ?? '—'}
          label="ATC"
          color="#a78bfa"
        />
      </div>

      {/* Search */}
      <div className="header-search">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Search callsign / pilot / VA…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Controls */}
      <div className="header-controls">
        {/* Live indicator */}
        <div className="live-badge">
          <Wifi size={12} />
          <span>LIVE</span>
          {lastUpdate && (
            <span className="live-age">{fmtRelativeTime(lastUpdate)}</span>
          )}
        </div>

        <button
          onClick={onToggleFlightsList}
          className={`icon-btn ${showFlightsList ? 'icon-btn--active' : ''}`}
          title="Toggle flights list"
        >
          <List size={16} />
        </button>

        <button
          onClick={onRefresh}
          className={`icon-btn ${loading ? 'spinning' : ''}`}
          title="Refresh now"
          disabled={loading}
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </header>
  );
}

function StatBadge({ icon, value, label, color }) {
  return (
    <div className="stat-badge">
      <span className="stat-value" style={{ color }}>
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
