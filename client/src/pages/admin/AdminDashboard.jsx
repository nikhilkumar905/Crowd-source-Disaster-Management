import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiShield, FiUsers, FiActivity, FiRadio,
  FiMap, FiPieChart, FiMapPin, FiRefreshCw, FiAlertTriangle, FiCheckCircle,
  FiTrash2, FiEdit2
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { subscribeToSocket } from '../../services/socket';
import { disastersApi } from '../../services/disasters';
import api from '../../services/api';
import { DisasterTypeBar, RequestStatusDoughnut, ActivitySparkline, SeverityChart } from '../../components/dashboard/AnalyticsCharts';
import BroadcastModal from '../../components/ui/BroadcastModal';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Actual colors (CSS vars don't work in Leaflet SVG)
const SEV_COLORS = ['#00ff87', '#00d4ff', '#ffaa00', '#ff6432', '#ff3d57'];

function StatusBadge({ status }) {
  const colors = {
    Open: '#ff3d57', Acknowledged: '#00d4ff', InProgress: '#3b82f6',
    Resolved: '#00ff87', Pending: '#ffaa00', Accepted: '#00d4ff',
    PendingVerification: '#a855f7', Completed: '#00ff87', Cancelled: '#6b7fa3',
  };
  const c = colors[status] || '#6b7fa3';
  return (
    <span style={{
      padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.7rem',
      fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
      color: c, background: `${c}18`, border: `1px solid ${c}40`,
    }}>{status}</span>
  );
}

// Helper to fly map to coordinates
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 13, { duration: 1.2 });
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

export default function AdminDashboard() {
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [broadcastReport, setBroadcastReport] = useState(null);
  const [flyTo, setFlyTo] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [rRes, qRes] = await Promise.all([
        disastersApi.getAll(),
        api.get('/requests'),
      ]);
      setReports(rRes.reports || []);
      setRequests(qRes.data.requests || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const unsub = subscribeToSocket(socket => {
      if (!socket) return;
      socket.emit('auth:join', { role: 'Admin' });
      socket.off('disaster:created', loadAll); socket.on('disaster:created', loadAll);
      socket.off('disaster:updated', loadAll); socket.on('disaster:updated', loadAll);
      socket.off('request:created', loadAll);  socket.on('request:created', loadAll);
      socket.off('request:updated', loadAll);  socket.on('request:updated', loadAll);
      socket.off('status_updated', loadAll);   socket.on('status_updated', loadAll);
      socket.off('new_request', loadAll);      socket.on('new_request', loadAll);
    });
    const poll = setInterval(loadAll, 15000);
    return () => { unsub(); clearInterval(poll); };
  }, [loadAll]);

  // Load users when switching to users tab
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab, loadUsers]);

  async function updateReportStatus(id, status) {
    try {
      await disastersApi.updateStatus(id, status);
      toast.success(`Status updated to "${status}"`);
      loadAll();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function changeUserRole(id, role) {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success(`Role changed to ${role}`);
      loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to change role');
    }
  }

  async function deleteUser(id, name) {
    // window.confirm might be blocked in some preview environments
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      loadUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete user');
    }
  }

  function handleFlyTo(lat, lng) {
    setFlyTo({ lat, lng });
    setActiveTab('map');
  }

  const totalEvents = reports.length + requests.length;
  const activeReports = reports.filter(r => r.status !== 'Resolved').length;
  const pendingReqs = requests.filter(r => r.status === 'Pending').length;
  const criticalCount = reports.filter(r => r.severity >= 4 && r.status !== 'Resolved').length;

  const TABS = [
    { id: 'overview',  label: 'Incidents & Dispatch', icon: FiActivity },
    { id: 'map',       label: 'Tactical Map',          icon: FiMap },
    { id: 'analytics', label: 'Analytics',             icon: FiPieChart },
    { id: 'users',     label: `Users (${users.length})`, icon: FiUsers },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e8f0ff', letterSpacing: '-0.03em' }}>Command Center</h1>
          <p style={{ color: '#6b7fa3', marginTop: '0.25rem', fontSize: '0.9rem' }}>Administrative oversight, analytics, and dispatch</p>
        </div>
        <button onClick={loadAll} className="glow-btn glow-btn--ghost" style={{ gap: '0.4rem' }}>
          <FiRefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Metric row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Events', value: totalEvents, color: '#a855f7', icon: FiActivity },
          { label: 'Active Incidents', value: activeReports, color: '#ffaa00', icon: FiShield },
          { label: 'Pending Requests', value: pendingReqs, color: '#00d4ff', icon: FiUsers },
          { label: 'Critical Alerts', value: criticalCount, color: '#ff3d57', icon: FiAlertTriangle, pulse: criticalCount > 0 },
        ].map(m => (
          <div key={m.label} className="metric-tile" style={{ borderTop: `3px solid ${m.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="metric-tile__value" style={{ color: m.pulse ? m.color : undefined }}>{m.value}</div>
                <div className="metric-tile__label">{m.label}</div>
              </div>
              <div className="metric-tile__icon" style={{ background: `${m.color}18`, color: m.color, position: 'relative' }}>
                {m.pulse && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '7px', height: '7px', borderRadius: '50%', background: m.color, animation: 'pulse-ring 1.2s ease-in-out infinite' }} />}
                <m.icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs card */}
      <div className="glass-card" style={{ padding: 0 }}>
        <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />

        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner" /></div>
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                  {/* Disaster Reports Table */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 className="section-eyebrow">Disaster Reports ({reports.length})</h3>
                      <span style={{ fontSize: '0.75rem', color: '#6b7fa3' }}>Click coordinates to fly map →</span>
                    </div>
                    {reports.length === 0 ? (
                      <div className="empty-state"><FiCheckCircle size={24} color="#00ff87" /><div>No incidents reported yet.</div></div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="ops-table">
                          <thead><tr>
                            <th>Type / Severity</th>
                            <th>Description</th>
                            <th>Coordinates</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr></thead>
                          <tbody>
                            {reports.map(r => {
                              const sevColor = SEV_COLORS[Math.max(0,(r.severity||1)-1)];
                              return (
                                <tr key={r._id}>
                                  <td>
                                    <div style={{ fontWeight: 800, color: '#e8f0ff' }}>{r.disasterType}</div>
                                    <div style={{ fontSize: '0.72rem', color: sevColor, fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sevColor }} />
                                      Level {r.severity}
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '0.82rem', color: '#6b7fa3', maxWidth: '220px' }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                                  </td>
                                  <td>
                                    <button onClick={() => handleFlyTo(r.location.coordinates[1], r.location.coordinates[0])}
                                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#00d4ff', fontSize: '0.78rem', fontWeight: 600 }}
                                      title="Click to view on map">
                                      <FiMapPin size={12} />
                                      {r.location.coordinates[1].toFixed(3)}, {r.location.coordinates[0].toFixed(3)}
                                    </button>
                                  </td>
                                  <td>
                                    <select value={r.status} onChange={e => updateReportStatus(r._id, e.target.value)}
                                      style={{
                                        background: 'rgba(17,26,46,0.8)', border: '1px solid rgba(30,42,70,0.8)',
                                        borderRadius: '8px', color: '#e8f0ff', padding: '0.3rem 0.6rem',
                                        fontSize: '0.78rem', cursor: 'pointer', outline: 'none',
                                      }}>
                                      {['Open','Acknowledged','InProgress','Resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ fontSize: '0.75rem', color: '#414f6e' }}>
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => setBroadcastReport(r)} className="glow-btn glow-btn--solid-red"
                                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem' }}>
                                      <FiRadio size={13} /> Broadcast
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Resource Requests Table */}
                  <div>
                    <h3 className="section-eyebrow" style={{ marginBottom: '1rem' }}>Resource Requests ({requests.length})</h3>
                    {requests.length === 0 ? (
                      <div className="empty-state"><FiCheckCircle size={24} color="#00ff87" /><div>No resource requests yet.</div></div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="ops-table">
                          <thead><tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Requester</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                          </tr></thead>
                          <tbody>
                            {requests.map(r => (
                              <tr key={r._id}>
                                <td><span style={{ fontWeight: 800, color: '#e8f0ff' }}>{r.type}</span></td>
                                <td style={{ fontSize: '0.82rem', color: '#6b7fa3', maxWidth: '280px' }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e8f0ff' }}>{r.userId?.name || '—'}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#6b7fa3' }}>{r.userId?.email}</div>
                                </td>
                                <td><StatusBadge status={r.status} /></td>
                                <td>
                                  {r.assignedVolunteer ? (
                                    <div style={{ fontSize: '0.82rem', color: '#00d4ff', fontWeight: 600 }}>{r.assignedVolunteer.name}</div>
                                  ) : (
                                    <span style={{ color: '#414f6e', fontSize: '0.78rem' }}>Unassigned</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── MAP TAB ── */}
              {activeTab === 'map' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13,20,34,0.6)', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(30,42,70,0.6)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#e8f0ff', marginBottom: '0.15rem' }}>Live Incident Map</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7fa3' }}>
                        {reports.length} incidents plotted. Click a report row in "Incidents" tab to fly to location.
                      </div>
                    </div>
                    <button onClick={() => setHeatmapMode(v => !v)}
                      className={`glow-btn ${heatmapMode ? 'glow-btn--solid-cyan' : 'glow-btn--ghost'}`}
                      style={{ padding: '0.5rem 1rem', gap: '0.4rem' }}>
                      <FiMap size={15} /> Heatmap: {heatmapMode ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="map-shell" style={{ height: '560px' }}>
                    <MapContainer center={flyTo ? [flyTo.lat, flyTo.lng] : [20.5937, 78.9629]} zoom={flyTo ? 12 : 5}
                      style={{ height: '100%', width: '100%', borderRadius: '14px' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
                      {flyTo && <MapFlyTo coords={flyTo} />}

                      {reports.map(r => {
                        const sevColor = SEV_COLORS[Math.max(0,(r.severity||1)-1)];
                        const pos = [r.location.coordinates[1], r.location.coordinates[0]];
                        if (heatmapMode) {
                          return (
                            <CircleMarker key={r._id} center={pos}
                              radius={r.severity * 14}
                              pathOptions={{ color: sevColor, fillColor: sevColor, fillOpacity: 0.18, weight: 0 }} />
                          );
                        }
                        return (
                          <Marker key={r._id} position={pos}>
                            <Popup>
                              <div style={{ minWidth: '160px' }}>
                                <div style={{ fontWeight: 800, marginBottom: '4px' }}>{r.disasterType}</div>
                                <div style={{ fontSize: '0.78rem', color: sevColor, marginBottom: '4px' }}>Severity {r.severity}</div>
                                <div style={{ fontSize: '0.8rem', color: '#555' }}>{r.description}</div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {['Minor','Moderate','Serious','Critical','Catastrophic'].map((label, i) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#6b7fa3' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: SEV_COLORS[i] }} />
                        Level {i+1} — {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ANALYTICS TAB ── */}
              {activeTab === 'analytics' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  <div className="glass-card" style={{ background: 'rgba(13,20,34,0.5)' }}>
                    <h3 className="section-eyebrow" style={{ marginBottom: '1.5rem' }}>Incidents by Type</h3>
                    <DisasterTypeBar reports={reports} />
                  </div>

                  <div className="glass-card" style={{ background: 'rgba(13,20,34,0.5)' }}>
                    <h3 className="section-eyebrow" style={{ marginBottom: '1.5rem' }}>Request Status Breakdown</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
                      <RequestStatusDoughnut requests={requests} />
                    </div>
                  </div>

                  <div className="glass-card" style={{ background: 'rgba(13,20,34,0.5)', gridColumn: '1 / -1' }}>
                    <h3 className="section-eyebrow" style={{ marginBottom: '1.5rem' }}>7-Day Network Activity</h3>
                    <ActivitySparkline reports={reports} requests={requests} />
                  </div>

                  <div className="glass-card" style={{ background: 'rgba(13,20,34,0.5)' }}>
                    <h3 className="section-eyebrow" style={{ marginBottom: '1.5rem' }}>Severity Distribution</h3>
                    <SeverityChart reports={reports} />
                  </div>

                  {/* Summary cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { label: 'Resolution Rate', value: reports.length ? `${Math.round((reports.filter(r=>r.status==='Resolved').length/reports.length)*100)}%` : 'N/A', color: '#00ff87' },
                      { label: 'Completion Rate', value: requests.length ? `${Math.round((requests.filter(r=>r.status==='Completed').length/requests.length)*100)}%` : 'N/A', color: '#00d4ff' },
                      { label: 'Total Unique Volunteers', value: new Set(requests.filter(r=>r.assignedVolunteer).map(r=>r.assignedVolunteer._id||r.assignedVolunteer)).size, color: '#a855f7' },
                    ].map(s => (
                      <div key={s.label} style={{
                        padding: '1rem', borderRadius: '12px',
                        background: 'rgba(13,20,34,0.5)', border: '1px solid rgba(30,42,70,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontSize: '0.82rem', color: '#6b7fa3' }}>{s.label}</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── USERS TAB ── */}
              {activeTab === 'users' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 className="section-eyebrow">All Registered Users ({users.length})</h3>
                    <button onClick={loadUsers} className="glow-btn glow-btn--ghost" style={{ gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                      <FiRefreshCw size={13} /> Reload
                    </button>
                  </div>

                  {usersLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></div>
                  ) : users.length === 0 ? (
                    <div className="empty-state"><FiUsers size={28} color="#6b7fa3" /><div>No users found.</div></div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ops-table">
                        <thead><tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr></thead>
                        <tbody>
                          {users.map((u, i) => {
                            const roleColor = u.role === 'Admin' ? '#a855f7' : u.role === 'Volunteer' ? '#00d4ff' : '#ffaa00';
                            return (
                              <tr key={u._id}>
                                <td style={{ color: '#414f6e', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem' }}>{i + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#e8f0ff' }}>{u.name}</div>
                                </td>
                                <td style={{ fontSize: '0.82rem', color: '#6b7fa3' }}>{u.email}</td>
                                <td>
                                  <select
                                    value={u.role}
                                    onChange={e => changeUserRole(u._id, e.target.value)}
                                    style={{
                                      background: `${roleColor}12`,
                                      border: `1px solid ${roleColor}35`,
                                      borderRadius: '8px',
                                      color: roleColor,
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      outline: 'none',
                                    }}
                                  >
                                    <option value="Citizen">Citizen</option>
                                    <option value="Volunteer">Volunteer</option>
                                    <option value="Admin">Admin</option>
                                  </select>
                                </td>
                                <td style={{ fontSize: '0.75rem', color: '#414f6e' }}>
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    onClick={() => deleteUser(u._id, u.name)}
                                    title="Delete user"
                                    style={{
                                      background: 'rgba(255,61,87,0.08)',
                                      border: '1px solid rgba(255,61,87,0.25)',
                                      borderRadius: '8px',
                                      color: '#ff3d57',
                                      padding: '0.35rem 0.7rem',
                                      cursor: 'pointer',
                                      fontSize: '0.78rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      transition: 'all 150ms ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,87,0.18)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,61,87,0.08)'}
                                  >
                                    <FiTrash2 size={13} /> Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Role summary */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                      { role: 'Admin', color: '#a855f7' },
                      { role: 'Volunteer', color: '#00d4ff' },
                      { role: 'Citizen', color: '#ffaa00' },
                    ].map(({ role, color }) => {
                      const count = users.filter(u => u.role === role).length;
                      return (
                        <div key={role} style={{
                          padding: '0.65rem 1.25rem', borderRadius: '10px',
                          background: `${color}0e`, border: `1px solid ${color}28`,
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                          <span style={{ fontSize: '0.82rem', color: '#6b7fa3' }}>{role}s:</span>
                          <span style={{ fontWeight: 800, color, fontSize: '1rem' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {broadcastReport && <BroadcastModal report={broadcastReport} onClose={() => setBroadcastReport(null)} />}
    </div>
  );
}
