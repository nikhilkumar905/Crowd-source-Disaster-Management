import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

const defaultCenter = [12.9716, 77.5946];
const containerStyle = {
  width: '100%',
  height: '420px',
  borderRadius: '12px'
};

function pointToLatLng(point) {
  const lng = point?.coordinates?.[0] ?? point?.lng ?? point?.longitude;
  const lat = point?.coordinates?.[1] ?? point?.lat ?? point?.latitude;
  if (lng == null || lat == null) return null;
  return [Number(lat), Number(lng)];
}

function RefreshMapLayout() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => map.invalidateSize();
    refresh();

    const timer = window.setTimeout(refresh, 150);
    window.addEventListener('resize', refresh);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', refresh);
    };
  }, [map]);

  return null;
}

function UpdateMapViewport({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(defaultCenter, 11);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
  }, [map, points]);

  return null;
}

function createMarkerIcon(color) {
  return L.divIcon({
    className: '',
    html: `
      <span style="
        display:block;
        width:18px;
        height:18px;
        border-radius:999px;
        background:${color};
        border:3px solid rgba(255,255,255,0.96);
        box-shadow:0 10px 24px rgba(15,23,42,0.28);
      "></span>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

const reportIcon = createMarkerIcon('#dc2626');
const requestIcon = createMarkerIcon('#2563eb');
const volunteerIcon = createMarkerIcon('#16a34a');

export default function AdminMonitoringMap({ reports = [], requests = [], center = null, radiusKm = null }) {
  const reportMarkers = useMemo(
    () =>
      reports
        .map((report) => ({
          id: report._id,
          position: pointToLatLng(report.location),
          title: report.disasterType,
          subtitle: report.location?.address || null
        }))
        .filter((marker) => marker.position),
    [reports]
  );

  const requestMarkers = useMemo(
    () =>
      requests
        .map((request) => ({
          id: request._id,
          position: pointToLatLng(request.location),
          title: `${request.type} x${request.quantity}`,
          subtitle: request.location?.address || null
        }))
        .filter((marker) => marker.position),
    [requests]
  );

  const centerPoint = useMemo(() => pointToLatLng(center), [center]);

  const points = useMemo(
    () => [
      ...reportMarkers.map((marker) => marker.position),
      ...requestMarkers.map((marker) => marker.position),
      ...(centerPoint ? [centerPoint] : [])
    ],
    [centerPoint, reportMarkers, requestMarkers]
  );

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Red markers: disaster reports • Blue markers: resource requests
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgb(var(--line))]">
        <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom style={containerStyle}>
          <RefreshMapLayout />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <UpdateMapViewport points={points} />

          {centerPoint && Number(radiusKm) > 0 && (
            <Circle
              center={centerPoint}
              radius={Number(radiusKm) * 1000}
              pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.12, weight: 2 }}
            />
          )}

          {centerPoint && (
            <Marker position={centerPoint} icon={volunteerIcon}>
              <Popup>
                <div className="text-sm font-semibold">Search center</div>
                {Number(radiusKm) > 0 && (
                  <div className="mt-1 text-xs text-slate-600">Volunteer radius: {Number(radiusKm)} km</div>
                )}
              </Popup>
            </Marker>
          )}

          {reportMarkers.map((marker) => (
            <Marker key={`report_${marker.id}`} position={marker.position} icon={reportIcon}>
              <Popup>
                <div className="text-sm font-semibold">{marker.title}</div>
                {marker.subtitle && <div className="mt-1 text-xs text-slate-600">{marker.subtitle}</div>}
              </Popup>
            </Marker>
          ))}

          {requestMarkers.map((marker) => (
            <Marker key={`request_${marker.id}`} position={marker.position} icon={requestIcon}>
              <Popup>
                <div className="text-sm font-semibold">{marker.title}</div>
                {marker.subtitle && <div className="mt-1 text-xs text-slate-600">{marker.subtitle}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
