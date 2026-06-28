import { useState } from 'react';
import { broadcastsApi } from '../../services/broadcasts';
import toast from 'react-hot-toast';

export default function BroadcastModal({ report, onClose }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await broadcastsApi.send({ id: report._id, message });
      toast.success('Broadcast sent to all users');
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="mb-4">
          <div className="section-eyebrow mb-1">Emergency Broadcast</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'rgb(var(--text-1))' }}>
            Send Alert to All Users
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-2))', marginTop: '0.4rem' }}>
            This will push a live notification to all Citizens, Volunteers, and Admins via socket.
          </p>
        </div>

        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: 'rgba(var(--red) / 0.07)',
            border: '1px solid rgba(var(--red) / 0.2)',
            marginBottom: '1rem',
          }}
        >
          <div className="mono" style={{ fontSize: '0.7rem', color: 'rgb(var(--red))', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Related incident
          </div>
          <div style={{ fontWeight: 700, color: 'rgb(var(--text-1))', fontSize: '0.9rem' }}>
            {report.disasterType} — Severity {report.severity}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-2))', marginTop: '0.2rem' }}>
            {report.location?.address || `${report.location?.coordinates?.[1]?.toFixed(4)}, ${report.location?.coordinates?.[0]?.toFixed(4)}`}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="nx-label">Broadcast message</label>
          <textarea
            className="nx-input"
            style={{ minHeight: '100px', resize: 'vertical' }}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="E.g. Evacuation in progress — all residents in East ward should move to Central shelter immediately."
            maxLength={400}
          />
          <div style={{ fontSize: '0.73rem', color: 'rgb(var(--text-3))', marginTop: '0.3rem', textAlign: 'right' }}>
            {message.length}/400
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="glow-btn glow-btn--ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="glow-btn glow-btn--solid-red"
            onClick={handleSend}
            disabled={!message.trim() || sending}
            type="button"
          >
            {sending ? 'Broadcasting...' : '📡 Broadcast Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
