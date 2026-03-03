import { WORLD_TYPES } from '../../utils/constants';

export default function ServerSelector({ sessions, selectedServerId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="server-selector">
        {[1, 2, 3].map((i) => (
          <div key={i} className="server-btn server-btn--skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="server-selector">
      {sessions.map((session) => {
        const type = WORLD_TYPES[session.worldType] ?? { label: session.name, color: '#6b7280', bg: '#1f2937' };
        const isActive = session.id === selectedServerId;

        return (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`server-btn ${isActive ? 'server-btn--active' : ''}`}
            style={
              isActive
                ? { borderColor: type.color, background: type.bg + 'cc', color: type.color }
                : {}
            }
            title={session.name}
          >
            <span
              className="server-dot"
              style={{ background: type.color }}
            />
            <span className="server-short">{type.short ?? type.label}</span>
            <span className="server-count">{session.userCount}</span>
          </button>
        );
      })}
    </div>
  );
}
