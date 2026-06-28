import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const defaultCenter = [12.9716, 77.5946];

function selectedPosition(value) {
  if (value?.lat !== '' && value?.lng !== '' && value?.lat != null && value?.lng != null) {
    return [Number(value.lat), Number(value.lng)];
  }
  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });

  return null;
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

export default function MapPicker({ value, onChange, height = 320 }) {
  const initialCenter = useMemo(() => selectedPosition(value) || defaultCenter, [value]);
  const [center, setCenter] = useState(initialCenter);

  useEffect(() => {
    setCenter(initialCenter);
  }, [initialCenter]);

  const style = useMemo(() => ({ width: '100%', height: `${height}px`, borderRadius: '12px' }), [height]);
  const markerPosition = selectedPosition(value);

  function onMapClick({ lat, lng }) {
    const next = [lat, lng];
    setCenter(next);
    onChange?.({ lat, lng });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter([next.lat, next.lng]);
        onChange?.(next);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Click the map to set location.
          {markerPosition && (
            <span className="ml-2">
              Lat: {Number(value.lat).toFixed(5)} • Lng: {Number(value.lng).toFixed(5)}
            </span>
          )}
        </div>
        <button type="button" className="btn-ghost" onClick={useCurrentLocation}>
          Use current location
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[rgb(var(--line))]">
        <MapContainer center={center} zoom={13} scrollWheelZoom style={style}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelect={onMapClick} />
          <RecenterMap center={center} />
          {markerPosition && <Marker position={markerPosition} />}
        </MapContainer>
      </div>
    </div>
  );
}
