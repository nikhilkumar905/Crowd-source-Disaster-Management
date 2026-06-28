import re

with open('/home/nikhil-kumar-sah/Disaster Management/Local-Disaster-Alert---Resource-Coordination-Platform/client/src/pages/volunteer/VolunteerDashboard.jsx', 'r') as f:
    content = f.read()

# Add useSearchParams, TabBar, and disastersApi imports
content = content.replace("import { useState, useEffect, useMemo, useCallback } from 'react';", "import { useState, useEffect, useMemo, useCallback } from 'react';\nimport { useSearchParams } from 'react-router-dom';")
content = content.replace("import { requestsApi } from '../../services/requests';", "import { requestsApi } from '../../services/requests';\nimport { disastersApi } from '../../services/disasters';")

# Add TabBar component
tab_bar = """
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
"""
content = content.replace("export default function VolunteerDashboard() {", tab_bar + "\nexport default function VolunteerDashboard() {")

# Add state and tabs
state_injection = """
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
"""
content = content.replace("const [requests, setRequests] = useState([]);", state_injection + "  const [requests, setRequests] = useState([]);")

# Update loadRequests to loadData
load_data_def = """  const loadData = useCallback(async () => {
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
  }, []);"""
content = re.sub(r'const loadRequests = useCallback\(async \(\) => \{.*?\},\s*\[\]\);', load_data_def, content, flags=re.DOTALL)

# Update useEffect
use_effect_code = """  useEffect(() => {
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
  }, [uid, loadData]);"""
content = re.sub(r'useEffect\(\(\) => \{\s*loadRequests\(\);.*?return \(\) => \{ unsub\(\); clearInterval\(poll\); \};\s*\}, \[uid, loadRequests\]\);', use_effect_code, content, flags=re.DOTALL)

# Replace loadRequests calls
content = content.replace("loadRequests()", "loadData()")

# Update JSX
jsx_tabs = """
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
"""

content = content.replace("<div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,28vw,380px)', gap: '1.5rem', alignItems: 'start' }}>", jsx_tabs + "<div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(300px,28vw,380px)', gap: '1.5rem', alignItems: 'start' }}>")

content = content.replace("</div>\n    </div>\n  );\n}", "</div>\n      )}\n    </div>\n  );\n}")

with open('/home/nikhil-kumar-sah/Disaster Management/Local-Disaster-Alert---Resource-Coordination-Platform/client/src/pages/volunteer/VolunteerDashboard.jsx', 'w') as f:
    f.write(content)

print("Done updating VolunteerDashboard.jsx")
