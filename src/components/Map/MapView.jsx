import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLE, PILOT_STATES } from '../../utils/constants';
import { IF_3D_AIRPORTS } from '../../utils/if3dAirports';

/* ── SVG helpers ── */
function planeSVG(color, size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>`;
}

function pilotColor(state) {
  return PILOT_STATES[state]?.color ?? '#6b7280';
}

/* ── Aircraft HTML marker ──
 * Outer element is 0×0 — MapLibre anchor:'center' translate(-50%,-50%)
 * has nothing to compensate for, so the coord IS the exact pixel origin.
 * Inner 28×28 div is offset by -14px/-14px.
 */
function createAircraftEl(flight, isSelected) {
  const color = isSelected ? '#ffffff' : pilotColor(flight.pilotState);

  const el = document.createElement('div');
  el.className = 'ac-marker' + (isSelected ? ' ac-selected' : '');
  el.style.cssText = 'position: relative; width: 0; height: 0; cursor: pointer;';

  const inner = document.createElement('div');
  inner.style.cssText = `
    position: absolute;
    top: -14px; left: -14px;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    filter: drop-shadow(0 0 4px ${color}88);
    transition: filter 0.2s;
  `;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'ac-icon';
  iconWrap.style.transform = `rotate(${flight.heading ?? flight.track ?? 0}deg)`;
  iconWrap.innerHTML = planeSVG(color);

  // Pre-cache the SVG element to avoid querySelector on every update
  const svgEl = iconWrap.querySelector('svg');

  inner.appendChild(iconWrap);

  const tip = document.createElement('div');
  tip.textContent = flight.callsign || flight.username || '?';
  tip.style.cssText = `
    position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
    background: #0d1520ee; border: 1px solid #1e2d40; color: #e2e8f0;
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    padding: 2px 6px; border-radius: 4px; white-space: nowrap;
    pointer-events: none; opacity: 0; transition: opacity 0.15s; z-index: 10;
  `;
  inner.appendChild(tip);
  el.appendChild(inner);

  el.addEventListener('mouseenter', () => (tip.style.opacity = '1'));
  el.addEventListener('mouseleave', () => (tip.style.opacity = '0'));

  return { el, inner, iconWrap, svgEl };
}

/* ── Safe GeoJSON source update ── */
function setSourceData(map, sourceId, data) {
  try {
    map.getSource(sourceId)?.setData(data);
  } catch { /* map may be mid-cleanup */ }
}

/* ── Component ── */
export default function MapView({
  flights,
  atc,
  airports,
  selectedFlight,
  route,
  flightPlan,
  onFlightClick,
  onAirportClick,
}) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const acMarkersRef  = useRef(new Map()); // flightId → { marker, el, inner, iconWrap, svgEl }
  const sourcesReady  = useRef(false);
  const prevSelectedRef = useRef(null);

  // Pending-data refs: store latest values so map.on('load') can apply them
  const routePendingRef    = useRef(null);
  const planPendingRef     = useRef(null);
  const airportsPendingRef = useRef(null);

  // Keep callbacks in refs → stable closure inside map event handlers
  const onFlightClickRef  = useRef(onFlightClick);
  const onAirportClickRef = useRef(onAirportClick);
  useEffect(() => { onFlightClickRef.current  = onFlightClick;  }, [onFlightClick]);
  useEffect(() => { onAirportClickRef.current = onAirportClick; }, [onAirportClick]);

  /* ════════════════════════════════════════════
     MAP INIT — runs once
  ════════════════════════════════════════════ */
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [10, 25],
      zoom: 2.2,
      minZoom: 1,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      /* ── Route trail ── */
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        paint: { 'line-color': '#00d4ff', 'line-width': 2, 'line-opacity': 0.75 },
      });

      /* ── Flight plan (dashed) ── */
      map.addSource('flightplan', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'flightplan-line', type: 'line', source: 'flightplan',
        paint: {
          'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.4,
          'line-dasharray': [4, 4],
        },
      });

      /* ── Flight plan waypoint dots ── */
      map.addSource('flightplan-dots', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'flightplan-dots', type: 'circle', source: 'flightplan-dots',
        paint: {
          'circle-radius': 3, 'circle-color': '#ffffff', 'circle-opacity': 0.6,
          'circle-stroke-width': 1, 'circle-stroke-color': '#00d4ff',
        },
      });

      /* ── Active airports (ATC-filtered) GeoJSON source ──
       * Only airports present in the current ATC list are included,
       * so we never render more than ~50 features → no performance hit.
       */
      map.addSource('airports', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Circle: gold ring for 3D airports, purple for regular active airports
      map.addLayer({
        id: 'airports-circle',
        type: 'circle',
        source: 'airports',
        paint: {
          'circle-color': '#0a0e17',
          'circle-radius': ['case', ['boolean', ['get', 'is3D'], false], 7, 5],
          'circle-stroke-color': [
            'case', ['boolean', ['get', 'is3D'], false], '#f59e0b', '#a78bfa',
          ],
          'circle-stroke-width': ['case', ['boolean', ['get', 'is3D'], false], 2.5, 2],
          'circle-opacity': 0.92,
        },
      });

      // ICAO label below dot (visible from zoom 5, coloured by 3D status)
      map.addLayer({
        id: 'airports-label',
        type: 'symbol',
        source: 'airports',
        minzoom: 5,
        layout: {
          'text-field': ['get', 'icao'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 10, 11],
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-optional': true,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': ['case', ['boolean', ['get', 'is3D'], false], '#f59e0b', '#94a3b8'],
          'text-halo-color': '#070b12',
          'text-halo-width': 1.5,
        },
      });

      // "3D" badge above the dot for 3D airports (visible from zoom 6)
      map.addLayer({
        id: 'airports-3d-badge',
        type: 'symbol',
        source: 'airports',
        filter: ['boolean', ['get', 'is3D'], false],
        minzoom: 6,
        layout: {
          'text-field': '3D',
          'text-size': 8,
          'text-offset': [0, -1.8],
          'text-anchor': 'bottom',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Regular'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#f59e0b',
          'text-halo-color': '#070b12',
          'text-halo-width': 1,
        },
      });

      /* ── Airport click handler ── */
      const handleAirportClick = (e) => {
        if (!e.features?.length) return;
        const f = e.features[0];
        const [lon, lat] = f.geometry.coordinates;
        onAirportClickRef.current?.({
          icao:    f.properties.icao,
          iata:    f.properties.iata,
          name:    f.properties.name,
          city:    f.properties.city,
          country: f.properties.country,
          is3D:    f.properties.is3D === true || f.properties.is3D === 'true',
          lat,
          lon,
        });
      };

      map.on('click', 'airports-circle', handleAirportClick);
      map.on('mouseenter', 'airports-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'airports-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      /* ── Flush pending data ── */
      sourcesReady.current = true;

      if (routePendingRef.current)
        setSourceData(map, 'route', routePendingRef.current);

      if (planPendingRef.current) {
        setSourceData(map, 'flightplan',      planPendingRef.current.line);
        setSourceData(map, 'flightplan-dots', planPendingRef.current.dots);
      }

      if (airportsPendingRef.current)
        setSourceData(map, 'airports', airportsPendingRef.current);
    });

    mapRef.current = map;

    return () => {
      acMarkersRef.current.forEach(({ marker }) => marker.remove());
      acMarkersRef.current.clear();
      map.remove();
      mapRef.current   = null;
      sourcesReady.current = false;
    };
  }, []);

  /* ════════════════════════════════════════════
     AIRCRAFT MARKERS
     — Only creates new markers for new flights.
     — Updates position/heading/color in-place for existing ones
       using pre-cached element refs (no querySelector).
  ════════════════════════════════════════════ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(flights.map((f) => f.flightId));

    // Remove markers for departed flights
    for (const [id, { marker }] of acMarkersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        acMarkersRef.current.delete(id);
      }
    }

    for (const flight of flights) {
      const isSelected = selectedFlight?.flightId === flight.flightId;

      if (acMarkersRef.current.has(flight.flightId)) {
        // Update in-place (no DOM query needed — refs are pre-cached)
        const { marker, el, inner, iconWrap, svgEl } = acMarkersRef.current.get(flight.flightId);
        marker.setLngLat([flight.longitude, flight.latitude]);
        iconWrap.style.transform = `rotate(${flight.heading ?? flight.track ?? 0}deg)`;
        const color = isSelected ? '#ffffff' : pilotColor(flight.pilotState);
        svgEl.setAttribute('fill', color);
        inner.style.filter = `drop-shadow(0 0 ${isSelected ? 8 : 4}px ${color}88)`;
        el.classList.toggle('ac-selected', isSelected);
      } else {
        const { el, inner, iconWrap, svgEl } = createAircraftEl(flight, isSelected);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onFlightClickRef.current(flight);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([flight.longitude, flight.latitude])
          .addTo(map);
        acMarkersRef.current.set(flight.flightId, { marker, el, inner, iconWrap, svgEl });
      }
    }
  }, [flights, selectedFlight]);

  /* ════════════════════════════════════════════
     FLY TO SELECTED FLIGHT
  ════════════════════════════════════════════ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFlight) return;
    if (prevSelectedRef.current === selectedFlight.flightId) return;
    prevSelectedRef.current = selectedFlight.flightId;
    map.flyTo({
      center: [selectedFlight.longitude, selectedFlight.latitude],
      zoom: Math.max(map.getZoom(), 5),
      duration: 1200,
      essential: true,
    });
  }, [selectedFlight]);

  /* ════════════════════════════════════════════
     ROUTE TRAIL
  ════════════════════════════════════════════ */
  useEffect(() => {
    const coords = route?.map((p) => [p.longitude, p.latitude]) ?? [];
    const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
    routePendingRef.current = data;
    if (sourcesReady.current && mapRef.current)
      setSourceData(mapRef.current, 'route', data);
  }, [route]);

  /* ════════════════════════════════════════════
     FLIGHT PLAN
  ════════════════════════════════════════════ */
  useEffect(() => {
    const flatItems = (items) =>
      items?.flatMap((item) =>
        item.children?.length ? flatItems(item.children) : [item],
      ) ?? [];

    const wps = flatItems(flightPlan?.flightPlanItems ?? []).filter(
      (wp) => wp.location?.latitude != null && wp.location?.longitude != null,
    );
    const coords = wps.map((wp) => [wp.location.longitude, wp.location.latitude]);

    const line = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
    const dots = {
      type: 'FeatureCollection',
      features: wps.map((wp) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [wp.location.longitude, wp.location.latitude] },
        properties: { name: wp.name },
      })),
    };

    planPendingRef.current = { line, dots };
    if (sourcesReady.current && mapRef.current) {
      setSourceData(mapRef.current, 'flightplan',      line);
      setSourceData(mapRef.current, 'flightplan-dots', dots);
    }
  }, [flightPlan]);

  /* ════════════════════════════════════════════
     ACTIVE AIRPORTS — combined airports + ATC effect
     Shows:
       • All 3D airports (~350) — always visible, these are the main IF airports
       • Any additional airports with active ATC right now
     This keeps the rendered feature count at ~350-400 max vs 28 000,
     eliminating the clustering CPU overhead on zoom/pan.
  ════════════════════════════════════════════ */
  useEffect(() => {
    if (!airports?.length) return;

    // ATC-active airport ICAO codes right now
    const activeIcaos = new Set(atc.map((f) => f.airportName));

    // Show: 3D airports (always) + ATC-active airports (dynamic)
    const activeAirports = airports.filter(
      (a) => IF_3D_AIRPORTS.has(a.icao) || activeIcaos.has(a.icao),
    );

    const data = {
      type: 'FeatureCollection',
      features: activeAirports.map((a) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lon, a.lat] },
        properties: {
          icao:    a.icao,
          iata:    a.iata    ?? '',
          name:    a.name    ?? a.icao,
          city:    a.city    ?? '',
          country: a.country ?? '',
          is3D:    IF_3D_AIRPORTS.has(a.icao),
        },
      })),
    };

    airportsPendingRef.current = data;
    if (sourcesReady.current && mapRef.current)
      setSourceData(mapRef.current, 'airports', data);
  }, [airports, atc]);

  return <div ref={containerRef} className="map-container" />;
}
