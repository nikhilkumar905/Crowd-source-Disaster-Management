import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiMapPin, FiCamera, FiAlertCircle, FiClock,
  FiBox, FiActivity, FiLayers, FiShield, FiCheckCircle, FiRefreshCw
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSocket } from '../../services/socket';
import { disastersApi } from '../../services/disasters';
import { requestsApi } from '../../services/requests';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DISASTER_TYPES = ['Flood', 'Fire', 'Earthquake', 'Storm', 'Landslide', 'Other'];
const SEVERITIES = [
  { val: 1, label: 'Minor',        color: '#00ff87' },
  { val: 2, label: 'Moderate',     color: '#00d4ff' },
  { val: 3, label: 'Serious',      color: '#ffaa00' },
  { val: 4, label: 'Critical',     color: '#ff6432' },
  { val: 5, label: 'Catastrophic', color: '#ff3d57' }
];
const REQ_TYPES = ['Medical', 'Food', 'Water', 'Shelter', 'Rescue', 'Other'];

function StatusBadge({ status }) {
  const map = {
    Open:         { color: '#ff3d57', bg: 'rgba(255,61,87,0.1)',   border: 'rgba(255,61,87,0.25)' },
    Acknowledged: { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.25)' },
    InProgress:   { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.25)' },
    Resolved:     { color: '#00ff87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.22)' },
    Pending:      { color: '#ffaa00', bg: 'rgba(255,170,0,0.1)',   border: 'rgba(255,170,0,0.25)' },
    Accepted:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.25)' },
    Completed:    { color: '#00ff87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.22)' },
    Cancelled:    { color: '#6b7fa3', bg: 'rgba(107,127,163,0.1)', border: 'rgba(107,127,163,0.25)' },
  };
  const s = map[status] || map.Open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.7rem', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.04em', border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return position ? <Marker position={position} /> : null;
}

function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,42,70,0.8)', padding: '0 1.25rem', overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '1.1rem 1rem', background: 'none', border: 'none',
          color: active === t.id ? '#00d4ff' : '#6b7fa3',
          fontWeight: active === t.id ? 700 : 500, fontSize: '0.875rem',
          cursor: 'pointer', whiteSpace: 'nowrap',
          borderBottom: `2px solid ${active === t.id ? '#00d4ff' : 'transparent'}`,
          transition: 'all 150ms ease',
        }}>
          <t.icon size={15} /> {t.label}
        </button>
      ))}
    </div>
  );
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'report');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Report form
  const [type, setType] = useState(DISASTER_TYPES[0]);
  const [desc, setDesc] = useState('');
  const [severity, setSeverity] = useState(1);
  const [file, setFile] = useState(null);
  const [loc, setLoc] = useState({ lat: 20.5937, lng: 78.9629 });
  const [submitting, setSubmitting] = useState(false);

  // Request form
  const [reqType, setReqType] = useState(REQ_TYPES[0]);
  const [reqDesc, setReqDesc] = useState('');
  const [reqLoc, setReqLoc] = useState({ lat: 20.5937, lng: 78.9629 });
  const [reqSubmitting, setReqSubmitting] = useState(false);

  // Map search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState(null);

  const uid = user?.id || user?._id;

  const loadData = useCallback(async () => {
    try {
      const [rRes, qRes] = await Promise.all([
        disastersApi.getAll(),
        requestsApi.getMyRequests()
      ]);
      // Citizens only see their own reports (server filters), but filter client-side too for safety
      setReports(rRes.reports || []);
      setRequests(qRes.requests || []);
    } catch {
      toast.error('Failed to load your activity');
    } finally {
      setLoadingData(false);
    }
  }, []);

  async function verifyRequest(id, action) {
    try {
      await requestsApi.verify(id, action);
      toast.success(action === 'Confirm' ? 'Request marked as completed' : 'Request disputed');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to verify request');
    }
  }

  useEffect(() => {
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(pt); setReqLoc(pt);
      });
    }
    loadData();
    const unsub = subscribeToSocket(socket => {
      if (!socket) return;
      socket.emit('auth:join', { userId: uid, role: user.role });
      socket.off('disaster:updated', loadData);
      socket.off('request:updated', loadData);
      socket.off('request:created', loadData);
      socket.off('status_updated', loadData);
      socket.on('disaster:updated', loadData);
      socket.on('request:updated', loadData);
      socket.on('request:created', loadData);
      socket.on('status_updated', loadData);
    });
    const poll = setInterval(loadData, 15000);
    return () => { unsub(); clearInterval(poll); };
  }, [uid]);

  async function handleGeocode(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        if (activeTab === 'report') setLoc(coords);
        else if (activeTab === 'request') setReqLoc(coords);
        setFlyToCoords(coords);
      } else {
        toast.error('Location not found');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }

  function handleLocateMe() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (activeTab === 'report') setLoc(coords);
        else if (activeTab === 'request') setReqLoc(coords);
        setFlyToCoords(coords);
        toast.success('Found your location');
      }, () => toast.error('Geolocation failed'));
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('disasterType', type);
      fd.append('description', desc);
      fd.append('severity', severity);
      fd.append('location', JSON.stringify({ type: 'Point', coordinates: [loc.lng, loc.lat] }));
      if (file) fd.append('image', file);
      await disastersApi.create(fd);
      toast.success('✅ Incident reported successfully!');
      setDesc(''); setFile(null); setSeverity(1);
      setActiveTab('activity');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestSubmit(e) {
    e.preventDefault();
    setReqSubmitting(true);
    try {
      await requestsApi.create({
        type: reqType,
        quantity: 1,
        description: reqDesc,
        location: { type: 'Point', coordinates: [reqLoc.lng, reqLoc.lat] }
      });
      toast.success('✅ Aid request submitted!');
      setReqDesc('');
      setActiveTab('activity');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setReqSubmitting(false);
    }
  }

  const activeReports = reports.filter(r => r.status !== 'Resolved').length;
  const activeReqs = requests.filter(r => !['Completed', 'Cancelled'].includes(r.status)).length;

  const TABS = [
    { id: 'report',   label: 'Report Incident', icon: FiAlertCircle },
    { id: 'request',  label: 'Request Aid',     icon: FiShield },
    { id: 'activity', label: `My Activity (${reports.length + requests.length})`, icon: FiLayers },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e8f0ff', letterSpacing: '-0.03em' }}>Citizen Portal</h1>
          <p style={{ color: '#6b7fa3', marginTop: '0.25rem', fontSize: '0.9rem' }}>Report incidents and request emergency aid</p>
        </div>
        <button onClick={loadData} className="glow-btn glow-btn--ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'My Reports', value: reports.length, color: '#00d4ff', icon: FiAlertCircle },
          { label: 'Active Incidents', value: activeReports, color: '#ffaa00', icon: FiActivity },
          { label: 'Pending Aid Requests', value: activeReqs, color: '#a855f7', icon: FiBox },
        ].map(m => (
          <div key={m.label} className="metric-tile" style={{ borderTop: `3px solid ${m.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="metric-tile__value" style={{ color: m.color }}>{m.value}</div>
                <div className="metric-tile__label">{m.label}</div>
              </div>
              <div className="metric-tile__icon" style={{ background: `${m.color}18`, color: m.color }}><m.icon /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Layout */}
      <div className="glass-card" style={{ padding: 0 }}>
        <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />

        <div style={{ padding: '1.75rem' }}>

          {/* ── REPORT TAB ── */}
          {activeTab === 'report' && (
            <form onSubmit={handleReportSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'clamp(280px,45%,480px) 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="nx-label">Disaster Type</label>
                    <select className="nx-input" value={type} onChange={e => setType(e.target.value)}>
                      {DISASTER_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="nx-label">
                      Severity: <span style={{ color: SEVERITIES[severity-1].color, fontWeight: 800 }}>{SEVERITIES[severity-1].label}</span>
                    </label>
                    <input type="range" min={1} max={5} value={severity}
                      onChange={e => setSeverity(Number(e.target.value))}
                      style={{ width: '100%', accentColor: SEVERITIES[severity-1].color, cursor: 'pointer', marginTop: '0.4rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {SEVERITIES.map(s => (
                        <div key={s.val} onClick={() => setSeverity(s.val)} style={{
                          flex: 1, height: '4px', borderRadius: '999px', cursor: 'pointer',
                          background: severity >= s.val ? s.color : 'rgba(30,42,70,0.8)',
                          transition: 'background 200ms',
                        }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="nx-label">Description & Landmarks</label>
                    <textarea className="nx-input" rows={4} value={desc}
                      onChange={e => setDesc(e.target.value)} required
                      placeholder="Describe the situation in detail: affected area, number of people, visible damage..." />
                  </div>

                  <div>
                    <label className="nx-label">Photo Evidence <span style={{ color: '#6b7fa3' }}>(optional)</span></label>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(17,26,46,0.8)', border: '1px dashed rgba(30,42,70,0.8)',
                      borderRadius: '10px', cursor: 'pointer', color: file ? '#00d4ff' : '#6b7fa3',
                      fontSize: '0.85rem', transition: 'all 150ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,42,70,0.8)'}
                    >
                      <FiCamera size={18} />
                      <span>{file ? `📎 ${file.name}` : 'Click to upload an image...'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => setFile(e.target.files[0])} />
                    </label>
                  </div>

                  <button type="submit" disabled={submitting} className="glow-btn glow-btn--solid-cyan"
                    style={{ padding: '0.85rem', fontSize: '0.95rem' }}>
                    {submitting ? '⟳ Submitting...' : '🚨 Submit Incident Report'}
                  </button>
                </div>

                <div>
                  <label className="nx-label" style={{ marginBottom: '0.2rem' }}>Location Coordinates</label>
                  <p style={{ fontSize: '0.75rem', color: '#6b7fa3', marginBottom: '1rem', lineHeight: 1.4 }}>
                    Click on the map to drop a pin, or manually enter the exact latitude and longitude below.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Search by Area / Address</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="nx-input" placeholder="e.g. Mumbai, Maharashtra"
                          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          style={{ flex: 1, padding: '0.5rem 0.75rem' }} />
                        <button type="button" onClick={handleGeocode} disabled={isSearching}
                          className="glow-btn glow-btn--solid-cyan" style={{ padding: '0.5rem 0.75rem' }}>
                          {isSearching ? '...' : 'Search'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Quick Action</label>
                      <button type="button" onClick={handleLocateMe} className="glow-btn glow-btn--ghost"
                        style={{ width: '100%', padding: '0.5rem', justifyContent: 'center' }}>
                        <FiMapPin style={{ marginRight: '0.4rem' }} /> Go to My Location
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Latitude</label>
                      <input type="number" step="any" className="nx-input" 
                        value={loc.lat || ''} 
                        onChange={e => setLoc({ ...loc, lat: parseFloat(e.target.value) || 0 })} 
                        style={{ padding: '0.5rem 0.75rem' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Longitude</label>
                      <input type="number" step="any" className="nx-input" 
                        value={loc.lng || ''} 
                        onChange={e => setLoc({ ...loc, lng: parseFloat(e.target.value) || 0 })} 
                        style={{ padding: '0.5rem 0.75rem' }} 
                      />
                    </div>
                  </div>
                  <div className="map-shell" style={{ height: '380px' }}>
                    <MapContainer center={[loc.lat, loc.lng]} zoom={5} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
                      <LocationPicker position={loc} setPosition={setLoc} />
                      <MapFlyTo coords={flyToCoords} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ── REQUEST AID TAB ── */}
          {activeTab === 'request' && (
            <form onSubmit={handleRequestSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'clamp(280px,45%,480px) 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label className="nx-label">Type of Aid Needed</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                      {REQ_TYPES.map(t => (
                        <button key={t} type="button" onClick={() => setReqType(t)} style={{
                          padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid',
                          borderColor: reqType === t ? '#00d4ff' : 'rgba(30,42,70,0.8)',
                          background: reqType === t ? 'rgba(0,212,255,0.12)' : 'rgba(17,26,46,0.6)',
                          color: reqType === t ? '#00d4ff' : '#6b7fa3',
                          fontSize: '0.82rem', fontWeight: reqType === t ? 700 : 500,
                          cursor: 'pointer', transition: 'all 150ms ease',
                        }}>
                          {t === 'Medical' ? '🏥' : t === 'Food' ? '🍱' : t === 'Water' ? '💧' : t === 'Shelter' ? '🏠' : t === 'Rescue' ? '🚒' : '📦'} {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="nx-label">Description & Urgency</label>
                    <textarea className="nx-input" rows={5} value={reqDesc}
                      onChange={e => setReqDesc(e.target.value)} required
                      placeholder={`Describe what ${reqType} assistance you need. Be specific about quantity and urgency.`} />
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,170,0,0.07)', border: '1px solid rgba(255,170,0,0.2)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', color: '#ffaa00', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <FiAlertCircle size={15} /> Important
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#6b7fa3', lineHeight: 1.6 }}>
                      Drop a pin on the map at your exact location so volunteers can find you quickly.
                    </p>
                  </div>

                  <button type="submit" disabled={reqSubmitting} className="glow-btn glow-btn--solid-cyan"
                    style={{ padding: '0.85rem', fontSize: '0.95rem' }}>
                    {reqSubmitting ? '⟳ Submitting...' : '🆘 Request Assistance'}
                  </button>
                </div>

                <div>
                  <label className="nx-label" style={{ marginBottom: '0.2rem' }}>Location Coordinates</label>
                  <p style={{ fontSize: '0.75rem', color: '#6b7fa3', marginBottom: '1rem', lineHeight: 1.4 }}>
                    Click on the map to drop a pin, or manually enter the exact latitude and longitude below.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Search by Area / Address</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="nx-input" placeholder="e.g. Mumbai, Maharashtra"
                          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                          style={{ flex: 1, padding: '0.5rem 0.75rem' }} />
                        <button type="button" onClick={handleGeocode} disabled={isSearching}
                          className="glow-btn glow-btn--solid-cyan" style={{ padding: '0.5rem 0.75rem' }}>
                          {isSearching ? '...' : 'Search'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Quick Action</label>
                      <button type="button" onClick={handleLocateMe} className="glow-btn glow-btn--ghost"
                        style={{ width: '100%', padding: '0.5rem', justifyContent: 'center' }}>
                        <FiMapPin style={{ marginRight: '0.4rem' }} /> Go to My Location
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Latitude</label>
                      <input type="number" step="any" className="nx-input" 
                        value={reqLoc.lat || ''} 
                        onChange={e => setReqLoc({ ...reqLoc, lat: parseFloat(e.target.value) || 0 })} 
                        style={{ padding: '0.5rem 0.75rem' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#6b7fa3', fontWeight: 700, marginBottom: '0.3rem', display: 'block' }}>Longitude</label>
                      <input type="number" step="any" className="nx-input" 
                        value={reqLoc.lng || ''} 
                        onChange={e => setReqLoc({ ...reqLoc, lng: parseFloat(e.target.value) || 0 })} 
                        style={{ padding: '0.5rem 0.75rem' }} 
                      />
                    </div>
                  </div>
                  <div className="map-shell" style={{ height: '380px' }}>
                    <MapContainer center={[reqLoc.lat, reqLoc.lng]} zoom={5} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
                      <LocationPicker position={reqLoc} setPosition={setReqLoc} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ── ACTIVITY TAB ── */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></div>
              ) : (
                <>
                  {/* My Reports */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 className="section-eyebrow">My Incident Reports ({reports.length})</h3>
                    </div>
                    {reports.length === 0 ? (
                      <div className="empty-state">
                        <FiAlertCircle size={28} color="#6b7fa3" />
                        <div>No incidents reported yet. Use the "Report Incident" tab.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reports.map(r => {
                          const sev = SEVERITIES[Math.max(0, (r.severity || 1) - 1)];
                          return (
                            <div key={r._id} className="row-item">
                              <div style={{ width: '4px', background: sev.color, borderRadius: '999px', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 800, color: '#e8f0ff', fontSize: '0.95rem' }}>{r.disasterType}</span>
                                  <StatusBadge status={r.status} />
                                  <span style={{ fontSize: '0.72rem', color: sev.color, fontWeight: 700 }}>Level {r.severity} — {sev.label}</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: '#6b7fa3', marginBottom: '0.4rem', lineHeight: 1.5 }}>{r.description}</p>
                                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.72rem', color: '#414f6e' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FiMapPin size={11} />
                                    {r.location?.coordinates?.[1]?.toFixed(4)}, {r.location?.coordinates?.[0]?.toFixed(4)}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FiClock size={11} />
                                    {new Date(r.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {r.imageUrl && (
                                <img src={`http://localhost:5001${r.imageUrl}`} alt="evidence"
                                  style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* My Requests */}
                  <div>
                    <h3 className="section-eyebrow" style={{ marginBottom: '1rem' }}>My Aid Requests ({requests.length})</h3>
                    {requests.length === 0 ? (
                      <div className="empty-state">
                        <FiBox size={28} color="#6b7fa3" />
                        <div>No aid requests submitted yet. Use the "Request Aid" tab.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {requests.map(r => (
                          <div key={r._id} className="row-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#e8f0ff' }}>{r.type}</span>
                                <StatusBadge status={r.status} />
                              </div>
                              <p style={{ fontSize: '0.82rem', color: '#6b7fa3', lineHeight: 1.5 }}>{r.description}</p>
                              <div style={{ fontSize: '0.72rem', color: '#414f6e', marginTop: '0.35rem' }}>
                                <FiClock size={11} style={{ marginRight: '0.3rem' }} />
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                              {r.status === 'PendingVerification' && (
                                <div style={{ marginTop: '0.8rem', padding: '0.75rem', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.2)', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#00ff87', fontWeight: 600, marginBottom: '0.5rem' }}>Volunteer marked this as Complete. Please verify.</div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => verifyRequest(r._id, 'Confirm')} className="glow-btn glow-btn--solid-cyan" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}>✅ Confirm Received</button>
                                    <button onClick={() => verifyRequest(r._id, 'Dispute')} className="glow-btn glow-btn--ghost" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', borderColor: 'rgba(255,61,87,0.3)', color: '#ff3d57' }}>❌ Dispute / Not Received</button>
                                  </div>
                                </div>
                              )}
                            </div>
                            {r.assignedVolunteer && (
                              <div style={{ borderLeft: '1px solid rgba(30,42,70,0.8)', paddingLeft: '1rem', textAlign: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: '0.65rem', color: '#414f6e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                                  Assigned Volunteer
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00d4ff' }}>{r.assignedVolunteer.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#6b7fa3' }}>{r.assignedVolunteer.email}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
