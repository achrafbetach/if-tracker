export function fmtAlt(feet) {
  if (feet == null) return '—';
  if (feet < 0) return 'GND';
  return `${Math.round(feet).toLocaleString()} ft`;
}

export function fmtSpeed(kts) {
  if (kts == null) return '—';
  return `${Math.round(kts)} kts`;
}

export function fmtVS(fpm) {
  if (fpm == null) return '—';
  const sign = fpm > 0 ? '+' : '';
  return `${sign}${Math.round(fpm)} fpm`;
}

export function fmtHeading(deg) {
  if (deg == null) return '—';
  return `${Math.round(deg).toString().padStart(3, '0')}°`;
}

export function fmtTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function fmtRelativeTime(date) {
  if (!date) return null;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export function fmtDuration(startStr) {
  if (!startStr) return '—';
  const diff = Date.now() - new Date(startStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function vsArrow(fpm) {
  if (Math.abs(fpm) < 100) return '→';
  return fpm > 0 ? '↑' : '↓';
}

export function vsColor(fpm) {
  if (Math.abs(fpm) < 100) return '#94a3b8';
  return fpm > 0 ? '#10b981' : '#ef4444';
}
