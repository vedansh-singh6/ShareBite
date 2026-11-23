import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths under Vite by using div-based markers (no image assets).
function makeIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:700;">${label || ''}</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const ICONS = {
  pickup: makeIcon('#236B4E', 'P'),
  delivery: makeIcon('#F4A261', 'D'),
  ngo: makeIcon('#57A37E', 'N'),
  volunteer: makeIcon('#7C3AED', 'V'),
};

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    const valid = (points || []).filter((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (valid.length >= 2) {
      const bounds = L.latLngBounds(valid);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else if (valid.length === 1) {
      map.setView(valid[0], 13);
    }
  }, [points, map]);
  return null;
}

/**
 * Reusable OpenStreetMap map.
 * props:
 *   center: [lat, lon] (fallback when no points)
 *   zoom: number
 *   markers: [{ lat, lon, label, type, popup }]
 *   route: [[lat,lon], ...]  (draws a polyline)
 *   height: css height (default 260px)
 *   externalNavUrl: optional url for "Open in maps" link
 */
export default function MapView({ center = [12.97, 77.63], zoom = 12, markers = [], route = [], height = 260, className = '' }) {
  const pts = markers
    .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon))
    .map((m) => [m.lat, m.lon]);
  const routePts = (route || []).filter((p) => Array.isArray(p) && p.length === 2);

  return (
    <div className={`overflow-hidden rounded-2xl border border-charcoal/5 ${className}`} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={pts.length ? pts : routePts} />
        {routePts.length >= 2 && (
          <Polyline positions={routePts} pathOptions={{ color: '#236B4E', weight: 4, opacity: 0.7, dashArray: '6 6' }} />
        )}
        {markers
          .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon))
          .map((m, i) => (
            <Marker key={i} position={[m.lat, m.lon]} icon={ICONS[m.type] || ICONS.ngo}>
              {m.popup && <Popup>{m.popup}</Popup>}
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

export function openInMaps(lat, lon, label) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export { ICONS };