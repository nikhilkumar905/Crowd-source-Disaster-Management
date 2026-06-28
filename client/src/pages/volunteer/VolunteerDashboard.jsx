import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiCheckCircle, FiZap, FiRefreshCw, FiMapPin, FiClock, FiAlertCircle
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSocket } from '../../services/socket';
import { requestsApi } from '../../services/requests';
import { disastersApi } from '../../services/disasters';
import api from '../../services/api';
import AvailabilityToggle from '../../components/ui/AvailabilityToggle';
import 'leaflet/dist/leaflet.css';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SKILL_OPTS = ['Medical', 'Driving', 'Construction', 'Communication', 'Search & Rescue', 'Logistics', 'First Aid'];

function getDistance(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function StatusBadge({ status }) {
  const colors = {
    Pending:    { c: '#ffaa00', bg: 'rgba(255,170,0,0.1)',    b: 'rgba(255,170,0,0.3)' },
    Accepted:   { c: '#00d4ff', bg: 'rgba(0,212,255,0.1)',   b: 'rgba(0,212,255,0.3)' },
    InProgress: { c: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  b: 'rgba(59,130,246,0.3)' },
    Completed:  { c: '#00ff87', bg: 'rgba(0,255,135,0.08)',  b: 'rgba(0,255,135,0.25)' },
    Cancelled:  { c: '#6b7fa3', bg: 'rgba(107,127,163,0.1)',b: 'rgba(107,127,163,0.25)' },
  };
  const s = colors[status] || colors.Pending;
  return (
    <span style={{
      padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.7rem',
      fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      color: s.c, background: s.bg, border: `1px solid ${s.b}`,
    }}>{status}</span>
  );
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

export default function VolunteerDashboard() {
  const { user, setUser } = useAuth();
  const uid = user?.id || user?._id;

  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

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
  const [loading, setLoading] = useState(true);
  const [myLoc, setMyLoc] = useState({ lat: 20.5937, lng: 78.9629 });
  const [radiusKm, setRadiusKm] = useState(100);
  const [availLoading, setAvailLoading] = useState(false);
  // Local available state (user object from JWT may not have it)
  const [isAvailable, setIsAvailable] = useState(user?.available !== false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
    // Fetch fresh user data to get skills/available
    api.get('/users/me').then(({ data }) => {
      setIsAvailable(data.user?.available !== false);
      if (setUser && data.user) setUser({ ...user, ...data.user });
    }).catch(() => {});
  }, [uid]);

    const loadData = useCallback(async () => {
    try {
      const [reqRes, repRes] = await Promise.all([
        api.get('/requests'),
        disastersApi.getAll()
      ]);
      setRequests(reqRes.data.requests || []);
      setReports(repRes.reports || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    loadData();

    // Socket: remove old listeners first to prevent duplicates on reconnect
    const unsub = subscribeToSocket(socket => {
      if (!socket) return;
      socket.emit('auth:join', { userId: uid, role: user.role });
      socket.off('request:created', loadData);
      socket.off('request:updated', loadData);
      socket.off('request_accepted', loadData);
      socket.off('new_request', loadData);
      socket.off('status_updated', loadData);
      socket.off('disaster:created', loadData);
      socket.off('disaster:updated', loadData);
      socket.on('request:created', loadData);
      socket.on('request:updated', loadData);
      socket.on('request_accepted', loadData);
      socket.on('new_request', loadData);
      socket.on('status_updated', loadData);
      socket.on('disaster:created', loadData);
      socket.on('disaster:updated', loadData);
    });

    // Polling fallback every 15s in case socket misses events
    const poll = setInterval(loadData, 15000);

    return () => { unsub(); clearInterval(poll); };
  }, [uid, loadData]);

  async function toggleAvailability(avail) {
    setAvailLoading(true);
    try {
      await api.put('/users/me/availability', { available: avail });
      setIsAvailable(avail);
      toast.success(avail ? '✅ You are now Online & Available' : '⏸ You are now Offline');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update status');
    } finally {
      setAvailLoading(false);
    }
  }

  async function toggleSkill(skill) {
    const current = user?.skills || [];
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    try {
      const { data } = await api.put('/users/me/skills', { skills: updated });
      if (setUser) setUser(prev => ({ ...prev, skills: data.user?.skills || updated }));
      toast.success('Skills updated');
    } catch {
      toast.error('Failed to update skills');
    }
  }

  async function acceptRequest(id) {
    try {
      await requestsApi.accept(id);
      toast.success('✅ Request accepted! Good luck out there.');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to accept request');
    }
  }

  async function updateStatus(id, status) {
    try {
      await requestsApi.updateStatus(id, status);
      toast.success(`Status updated to "${status}"`);
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function respondToDisaster(id) {
    try {
      await disastersApi.respond(id);
      toast.success('Assigned to disaster. Stay safe.');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to respond');
    }
  }

  async function checkInDisaster(id) {
    try {
      await disastersApi.checkIn(id);
      toast.success('Check-in confirmed.');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to check in');
    }
  }

  const nearbyPending = useMemo(() => requests.filter(r => {
    if (r.status !== 'Pending') return false;
    if (!r.location?.coordinates) return false;
    const dist = getDistance(myLoc.lat, myLoc.lng, r.location.coordinates[1], r.location.coordinates[0]);
    return dist <= radiusKm;
  }), [requests, myLoc, radiusKm]);

  // My active missions - use assignedVolunteer (the real DB field)
  const myMissions = useMemo(() =>
    requests.filter(r => {
      const av = r.assignedVolunteer;
      if (!av) return false;
      const avId = av._id || av.id || av;
      return (avId === uid || avId?.toString?.() === uid) && r.status !== 'Completed';
    }),
    [requests, uid]
  );

  const userSkills = user?.skills || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e8f0ff', letterSpacing: '-0.03em' }}>Field Operations</h1>
          <p style={{ color: '#6b7fa3', marginTop: '0.25rem', fontSize: '0.9rem' }}>Accept nearby aid requests and manage your missions</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={loadData} className="glow-btn glow-btn--ghost" style={{ gap: '0.4rem' }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
        background: 'rgba(13,20,34,0.8)', padding: '1rem 1.5rem', borderRadius: '14px',
        border: '1px solid rgba(30,42,70,0.6)', marginBottom: '1.75rem',
      }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Duty Status</div>
          <AvailabilityToggle available={isAvailable} onChange={toggleAvailability} loading={availLoading} />
        </div>
        <div style={{ width: '1px', height: '36px', background: 'rgba(30,42,70,0.8)' }} />
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.25rem' }}>Active Missions</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: myMissions.length > 0 ? '#00d4ff' : '#414f6e' }}>{myMissions.length}</div>
        </div>
        <div style={{ width: '1px', height: '36px', background: 'rgba(30,42,70,0.8)' }} />
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.25rem' }}>Nearby ({Math.round(radiusKm)} km)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: nearbyPending.length > 0 ? '#ffaa00' : '#414f6e' }}>{nearbyPending.length}</div>
        </div>
        <div style={{ width: '1px', height: '36px', background: 'rgba(30,42,70,0.8)' }} />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Search Radius: {Math.round(radiusKm)} km</div>
          <input type="range" min={5} max={500} value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#00d4ff', cursor: 'pointer' }} />
        </div>
      </div>

      
      <div className="glass-card" style={{ padding: 0, marginBottom: '2rem' }}>
        <TabBar
          tabs={[
            { id: 'overview', label: 'Active Disasters', icon: FiAlertCircle },
            { id: 'map', label: 'Field Operations', icon: FiMapPin }
          ]}
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {activeTab === 'overview' && (
        <div className="glass-card">
          <h3 className="section-eyebrow" style={{ marginBottom: '1.25rem' }}>Active Disaster Incidents ({reports.filter(r => r.status !== 'Resolved').length})</h3>
          {reports.filter(r => r.status !== 'Resolved').length === 0 ? (
            <div className="empty-state">
              <FiCheckCircle size={28} color="#00ff87" />
              <div>No active disasters. The area is clear.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {reports.filter(r => r.status !== 'Resolved').map(r => (
                <div key={r._id} style={{
                  background: 'rgba(17,26,46,0.6)', border: '1px solid rgba(30,42,70,0.7)',
                  borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#ff3d57', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{r.disasterType}</div>
                      <div style={{ fontSize: '0.75rem', color: '#ffaa00', fontWeight: 700 }}>Severity Level {r.severity}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7fa3', textAlign: 'right' }}>
                      <div>{new Date(r.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(r.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  
                  {r.imageUrl && (
                    <img src={`http://localhost:5001${r.imageUrl}`} alt="Disaster" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                  )}
                  
                  <p style={{ fontSize: '0.85rem', color: '#e8f0ff', lineHeight: 1.5 }}>{r.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#00d4ff' }}>
                    <FiMapPin size={12} />
                    {r.location?.coordinates?.[1]?.toFixed(4)}, {r.location?.coordinates?.[0]?.toFixed(4)}
                  </div>
                  
                  {/* Action buttons */}
                  {(() => {
                    const myResponder = r.responders?.find(resp => resp.volunteerId === uid || resp.volunteerId?._id === uid);
                    if (!myResponder) {
                      return (
                        <button
                          onClick={() => respondToDisaster(r._id)}
                          className="glow-btn glow-btn--ghost"
                          style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                        >
                          Respond to Incident
                        </button>
                      );
                    } else if (myResponder.status === 'EnRoute') {
                      const dist = r.location?.coordinates ? getDistance(myLoc.lat, myLoc.lng, r.location.coordinates[1], r.location.coordinates[0]) : 999;
                      const canCheckIn = dist <= 0.5; // within 500m
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                          <button
                            onClick={() => checkInDisaster(r._id)}
                            disabled={!canCheckIn}
                            className={`glow-btn ${canCheckIn ? 'glow-btn--solid-cyan' : 'glow-btn--ghost'}`}
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            ✓ Arrived at Site
                          </button>
                          {!canCheckIn && (
                            <span style={{ fontSize: '0.7rem', color: '#ffaa00', textAlign: 'center' }}>
                              You must be within 500m to check in. (Currently {dist.toFixed(2)} km)
                            </span>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div style={{
                          marginTop: '0.5rem', padding: '0.6rem', background: 'rgba(0,255,135,0.1)',
                          border: '1px solid rgba(0,255,135,0.3)', borderRadius: '8px',
                          color: '#00ff87', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600
                        }}>
                          Checked In ✓
                        </div>
                      );
                    }
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
<div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,28vw,380px)', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Map + Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Map */}
          <div className="glass-card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(30,42,70,0.6)' }}>
              <div style={{ fontWeight: 800, color: '#e8f0ff', fontSize: '1rem' }}>Operation Zone Map</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7fa3', marginTop: '0.15rem' }}>
                Your position (blue) and nearby pending requests (orange). Adjust radius with the slider above.
              </div>
            </div>
            <div style={{ height: '400px' }}>
              <MapContainer center={[myLoc.lat, myLoc.lng]} zoom={6} style={{ height: '100%', width: '100%', borderRadius: '0 0 16px 16px' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />

                {/* My location */}
                <Marker position={[myLoc.lat, myLoc.lng]}>
                  <Popup><b>Your Location</b></Popup>
                </Marker>

                {/* Radius circle — using actual hex colors, not CSS vars */}
                <Circle center={[myLoc.lat, myLoc.lng]} radius={radiusKm * 1000}
                  pathOptions={{ color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }} />

                {/* Nearby pending markers */}
                {nearbyPending.map(r => (
                  <Marker key={r._id} position={[r.location.coordinates[1], r.location.coordinates[0]]}>
                    <Popup>
                      <div style={{ minWidth: '160px' }}>
                        <div style={{ fontWeight: 800, marginBottom: '4px' }}>{r.type} Request</div>
                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '8px' }}>{r.description}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                          {getDistance(myLoc.lat, myLoc.lng, r.location.coordinates[1], r.location.coordinates[0]).toFixed(1)} km away
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Nearby Pending Requests */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 className="section-eyebrow">Pending Requests in Zone ({nearbyPending.length})</h3>
              {!isAvailable && (
                <span style={{ fontSize: '0.75rem', color: '#ff3d57', fontStyle: 'italic' }}>
                  Go online to accept requests
                </span>
              )}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
            ) : nearbyPending.length === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem' }}>
                <FiCheckCircle size={28} color="#00ff87" />
                <div>No pending requests in your zone. Try increasing the radius.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {nearbyPending.map(r => {
                  const dist = getDistance(myLoc.lat, myLoc.lng, r.location.coordinates[1], r.location.coordinates[0]).toFixed(1);
                  return (
                    <div key={r._id} style={{
                      background: 'rgba(17,26,46,0.6)', border: '1px solid rgba(30,42,70,0.7)',
                      borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem',
                      transition: 'border-color 150ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,42,70,0.7)'}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, color: '#00d4ff', fontSize: '0.95rem' }}>{r.type}</span>
                          <span style={{ fontSize: '0.72rem', color: '#ffaa00', fontWeight: 700 }}>📍 {dist} km</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#6b7fa3', lineHeight: 1.5, marginBottom: '0.3rem' }}>{r.description}</p>
                        <div style={{ fontSize: '0.7rem', color: '#414f6e' }}>
                          <FiClock size={10} style={{ marginRight: '0.3rem' }} />
                          {new Date(r.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => acceptRequest(r._id)}
                        disabled={!isAvailable}
                        className="glow-btn glow-btn--solid-cyan"
                        style={{ width: '100%', padding: '0.6rem' }}
                      >
                        {isAvailable ? <><FiZap size={14} /> Accept Mission</> : 'Go Online to Accept'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Active Missions */}
          <div className="glass-card">
            <h3 className="section-eyebrow" style={{ marginBottom: '1rem' }}>My Active Missions ({myMissions.length})</h3>
            {myMissions.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#414f6e', textAlign: 'center', padding: '1rem 0' }}>
                No active missions. Accept a request from the list.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {myMissions.map(r => (
                  <div key={r._id} style={{
                    background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.18)',
                    borderRadius: '12px', padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 800, color: '#00d4ff' }}>{r.type} Request</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#6b7fa3', marginBottom: '1rem', lineHeight: 1.4 }}>{r.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => updateStatus(r._id, 'InProgress')}
                        disabled={r.status === 'InProgress'}
                        className="glow-btn glow-btn--ghost"
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', justifyContent: 'center' }}>
                        ⬆ En Route
                      </button>
                      <button onClick={() => updateStatus(r._id, 'PendingVerification')}
                        className="glow-btn glow-btn--ghost"
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', color: '#00ff87', borderColor: 'rgba(0,255,135,0.3)', justifyContent: 'center' }}>
                        ✓ Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="glass-card">
            <h3 className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>My Skill Set</h3>
            <p style={{ fontSize: '0.78rem', color: '#6b7fa3', marginBottom: '1rem', lineHeight: 1.5 }}>
              Toggle the skills you can provide. These help admins assign the right tasks to you.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SKILL_OPTS.map(s => {
                const sel = userSkills.includes(s);
                return (
                  <button key={s} onClick={() => toggleSkill(s)} style={{
                    padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem',
                    fontWeight: sel ? 700 : 500, cursor: 'pointer', border: '1px solid',
                    borderColor: sel ? '#00d4ff' : 'rgba(30,42,70,0.8)',
                    background: sel ? 'rgba(0,212,255,0.15)' : 'rgba(17,26,46,0.6)',
                    color: sel ? '#00d4ff' : '#6b7fa3',
                    transition: 'all 150ms ease',
                  }}>
                    {sel ? '✓ ' : ''}{s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completed missions */}
          {requests.filter(r => {
            const av = r.assignedVolunteer;
            if (!av) return false;
            const avId = av._id || av.id || av;
            return (avId === uid || avId?.toString?.() === uid) && r.status === 'Completed';
          }).length > 0 && (
            <div className="glass-card">
              <h3 className="section-eyebrow" style={{ marginBottom: '1rem' }}>Completed Missions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {requests
                  .filter(r => {
                    const av = r.assignedVolunteer;
                    if (!av) return false;
                    const avId = av._id || av.id || av;
                    return (avId === uid || avId?.toString?.() === uid) && r.status === 'Completed';
                  })
                  .slice(0, 5)
                  .map(r => (
                    <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.12)' }}>
                      <FiCheckCircle size={16} color="#00ff87" />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e8f0ff' }}>{r.type}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7fa3' }}>{new Date(r.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
