import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiBell, FiX, FiVolume2 } from 'react-icons/fi';
import Sidebar, { MobileNavTrigger } from './Sidebar';
import { subscribeToSocket } from '../../services/socket';
import { useNotifications } from '../../context/NotificationsContext';
import toast from 'react-hot-toast';

export default function AppShell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);

  const { items, unreadCount, add, markAllRead, clear } = useNotifications();

  useEffect(() => {
    let detach = () => {};
    const unsub = subscribeToSocket((socket) => {
      detach();
      if (!socket) return;

      const onDisaster = ({ report }) => add({ tone: 'danger', title: 'New disaster report', message: `${report.disasterType} • severity ${report.severity}`, payload: report });
      const onDisasterUpdated = ({ report }) => add({ tone: report.status === 'Resolved' ? 'success' : 'info', title: 'Disaster report updated', message: `${report.disasterType}: ${report.status}`, payload: report });
      const onRequestCreated = ({ request }) => add({ tone: 'info', title: 'New resource request', message: `${request.type} × ${request.quantity}`, payload: request });
      const onRequestUpdated = ({ request }) => add({ tone: request.status === 'Completed' ? 'success' : 'info', title: 'Resource request updated', message: `${request.type}: ${request.status}`, payload: request });
      const onStatus = ({ requestId, status }) => add({ tone: 'success', title: 'Request status updated', message: `${requestId}: ${status}`, payload: { requestId, status } });
      const onAccepted = ({ request, requestId, status }) => {
        const entry = request || { _id: requestId, status };
        add({ tone: 'success', title: 'Request accepted', message: entry?._id ? `${entry._id}: ${entry.status || status || 'Accepted'}` : 'A request was accepted', payload: entry });
      };
      const onBroadcast = (payload) => {
        setBroadcasts(prev => [payload, ...prev].slice(0, 10));
        toast.error(`📡 BROADCAST: ${payload.message}`, { duration: 8000, style: { background: 'rgb(13,20,34)', color: 'rgb(232,240,255)', border: '1px solid rgba(255,61,87,0.4)' } });
        add({ tone: 'danger', title: `📡 Emergency Broadcast — ${payload.disasterType}`, message: payload.message, payload });
      };

      socket.on('disaster:created', onDisaster);
      socket.on('disaster:updated', onDisasterUpdated);
      socket.on('request:created', onRequestCreated);
      socket.on('request:updated', onRequestUpdated);
      socket.on('request_accepted', onAccepted);
      socket.on('status_updated', onStatus);
      socket.on('alert:broadcast', onBroadcast);

      detach = () => {
        socket.off('disaster:created', onDisaster);
        socket.off('disaster:updated', onDisasterUpdated);
        socket.off('request:created', onRequestCreated);
        socket.off('request:updated', onRequestUpdated);
        socket.off('request_accepted', onAccepted);
        socket.off('status_updated', onStatus);
        socket.off('alert:broadcast', onBroadcast);
      };
    });
    return () => { detach(); unsub(); };
  }, [add]);

  useEffect(() => {
    if (notifOpen && unreadCount > 0) {
      markAllRead();
    }
  }, [notifOpen, unreadCount, markAllRead]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const toneDot = (tone) => {
    if (tone === 'danger') return 'rgb(var(--red))';
    if (tone === 'success') return 'rgb(var(--green))';
    return 'rgb(var(--cyan))';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: 'rgb(var(--s900))' }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          background: 'rgba(var(--s800)/0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(var(--border)/0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MobileNavTrigger onClick={() => setMobileNavOpen(true)} />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'rgb(var(--text-1))' }}>
                NEXUS <span style={{ color: 'rgb(var(--cyan))' }}>RESPONSE</span>
              </div>
              <div className="mono" style={{ fontSize: '0.62rem', color: 'rgb(var(--text-3))', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Live disaster coordination
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.7rem', borderRadius: '999px', background: 'rgba(var(--green)/0.08)', border: '1px solid rgba(var(--green)/0.2)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(var(--green))', boxShadow: '0 0 6px rgb(var(--green))', display: 'inline-block', animation: 'pulse-ring 2s ease-in-out infinite' }} />
              <span className="mono" style={{ fontSize: '0.65rem', color: 'rgb(var(--green))', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
            </div>

            {/* Broadcast indicator */}
            {broadcasts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.7rem', borderRadius: '999px', background: 'rgba(var(--red)/0.1)', border: '1px solid rgba(var(--red)/0.3)', cursor: 'pointer' }}
                onClick={() => setNotifOpen(true)}>
                <FiVolume2 size={12} color="rgb(var(--red))" />
                <span className="mono" style={{ fontSize: '0.65rem', color: 'rgb(var(--red))', fontWeight: 700 }}>BROADCAST</span>
              </div>
            )}

            {/* Notif bell */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(var(--border)/0.7)',
                background: 'rgba(var(--s700)/0.6)', color: 'rgb(var(--text-2))',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(var(--cyan)/0.3)'; e.currentTarget.style.color = 'rgb(var(--text-1))'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(var(--border)/0.7)'; e.currentTarget.style.color = 'rgb(var(--text-2))'; }}
            >
              <FiBell size={16} />
              <span className="hidden sm:inline">Alerts</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  minWidth: '18px', height: '18px', borderRadius: '999px',
                  background: 'rgb(var(--red))', color: 'white',
                  fontSize: '0.65rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 8px rgba(var(--red)/0.6)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.25rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="md:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileNavOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 'min(260px, 88vw)', borderRight: '1px solid rgba(var(--border)/0.5)', zIndex: 51 }}>
            <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Notifications panel */}
      {notifOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setNotifOpen(false)} />
          <aside style={{
            position: 'absolute', right: 0, top: 0, height: '100%', width: '100%', maxWidth: '400px',
            background: 'rgb(var(--s800))',
            borderLeft: '1px solid rgba(var(--border)/0.6)',
            padding: '1.25rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'rgb(var(--text-1))' }}>Alert Feed</div>
                <div className="mono" style={{ fontSize: '0.65rem', color: 'rgb(var(--text-3))', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Real-time platform events
                </div>
              </div>
              <button className="glow-btn glow-btn--ghost" onClick={() => setNotifOpen(false)} style={{ padding: '0.4rem' }}>
                <FiX size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="glow-btn glow-btn--ghost" onClick={markAllRead} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>Mark all read</button>
              <button className="glow-btn glow-btn--ghost" onClick={clear} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>Clear all</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
              {items.length === 0 ? (
                <div className="empty-state">No notifications yet</div>
              ) : (
                items.map(n => (
                  <div key={n.id} style={{
                    padding: '0.85rem 0.9rem', borderRadius: '12px',
                    background: 'rgba(var(--s700)/0.6)',
                    border: '1px solid rgba(var(--border)/0.5)',
                    display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: toneDot(n.tone), flexShrink: 0, marginTop: '4px', boxShadow: `0 0 6px ${toneDot(n.tone)}` }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgb(var(--text-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'rgb(var(--text-3))', flexShrink: 0 }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgb(var(--text-2))', marginTop: '0.2rem' }}>{n.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
