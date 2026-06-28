export default function AvailabilityToggle({ available, onChange, loading }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!available)}
      disabled={loading}
      style={{ background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
      title={available ? 'Click to go offline' : 'Click to go online'}
    >
      <span className={`avail-track ${available ? 'on' : 'off'}`}>
        <span className="avail-thumb" />
      </span>
      <span style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: available ? 'rgb(var(--green))' : 'rgb(var(--text-3))',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        transition: 'color 250ms ease',
      }}>
        {available ? 'Available' : 'Offline'}
      </span>
    </button>
  );
}
