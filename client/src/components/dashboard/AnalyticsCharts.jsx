/* Pure SVG analytics charts — no external chart library needed */

const COLORS = {
  cyan: 'rgb(0, 212, 255)',
  green: 'rgb(0, 255, 135)',
  red: 'rgb(255, 61, 87)',
  amber: 'rgb(255, 170, 0)',
  purple: 'rgb(168, 85, 247)',
  blue: 'rgb(59, 130, 246)',
};

const DISASTER_COLORS = {
  Flood: COLORS.blue,
  Fire: COLORS.red,
  Earthquake: COLORS.amber,
  Storm: COLORS.cyan,
  Landslide: COLORS.green,
  Other: COLORS.purple,
};

const REQUEST_COLORS = {
  Pending: COLORS.amber,
  Accepted: COLORS.cyan,
  InProgress: COLORS.blue,
  PendingVerification: COLORS.purple,
  Completed: COLORS.green,
  Cancelled: '#374151',
};

/* Bar Chart — disaster types */
export function DisasterTypeBar({ reports }) {
  const typeCounts = {};
  for (const r of reports) {
    typeCounts[r.disasterType] = (typeCounts[r.disasterType] || 0) + 1;
  }
  const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;

  if (entries.length === 0) return (
    <div className="empty-state" style={{ minHeight: '160px' }}>No disaster reports yet</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {entries.map(([type, count]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '80px', fontSize: '0.78rem', fontWeight: 600, color: '#6b7fa3', textAlign: 'right', flexShrink: 0 }}>
            {type}
          </div>
          <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'rgba(30,42,70,0.8)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '999px',
                background: DISASTER_COLORS[type] || COLORS.cyan,
                width: `${(count / max) * 100}%`,
                transition: 'width 600ms ease',
                boxShadow: `0 0 8px ${DISASTER_COLORS[type] || COLORS.cyan}50`,
              }}
            />
          </div>
          <div style={{ width: '24px', fontSize: '0.8rem', fontWeight: 800, color: '#e8f0ff', textAlign: 'right', flexShrink: 0 }}>
            {count}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Doughnut Chart — request status */
export function RequestStatusDoughnut({ requests }) {
  const statusCounts = {};
  for (const r of requests) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }
  const entries = Object.entries(statusCounts);
  const total = requests.length || 1;

  const radius = 52;
  const cx = 72;
  const cy = 72;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = entries.map(([status, count]) => {
    const frac = count / total;
    const arc = { status, count, frac, offset, color: REQUEST_COLORS[status] || COLORS.cyan };
    offset += frac;
    return arc;
  });

  if (entries.length === 0) return (
    <div className="empty-state" style={{ minHeight: '160px' }}>No requests yet</div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width={144} height={144} viewBox="0 0 144 144" className="chart-svg" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(30,42,70,0.8)" strokeWidth={strokeWidth} />
        {arcs.map(({ status, frac, offset: off, color }) => (
          <circle
            key={status}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${frac * circumference} ${circumference}`}
            strokeDashoffset={-off * circumference}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 600ms ease', filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" style={{ fill: '#e8f0ff', fontSize: '1.4rem', fontWeight: 800 }}>
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px' }}>
        {arcs.map(({ status, count, color }) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ color: '#6b7fa3', flex: 1 }}>{status}</span>
            <span style={{ fontWeight: 700, color: '#e8f0ff' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Sparkline — last 7 days activity */
export function ActivitySparkline({ reports, requests }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  const counts = days.map(day => {
    const rCount = reports.filter(r => new Date(r.createdAt).toDateString() === day).length;
    const qCount = requests.filter(r => new Date(r.createdAt).toDateString() === day).length;
    return { day, total: rCount + qCount, reports: rCount, requests: qCount };
  });

  const max = Math.max(...counts.map(c => c.total), 1);
  const W = 280, H = 80;

  const points = counts.map((c, i) => ({
    x: (i / 6) * (W - 20) + 10,
    y: H - 10 - ((c.total / max) * (H - 20)),
    ...c
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - 10} L ${points[0].x} ${H - 10} Z`;

  const dayLabels = days.map(d => new Date(d).toLocaleDateString('en', { weekday: 'short' }));

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} className="chart-svg" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(0,212,255)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(0,212,255)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkGrad)" />
        <path d={pathD} fill="none" stroke="rgb(0,212,255)" strokeWidth="2" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgb(0,212,255))' }} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="rgb(0,212,255)" style={{ filter: 'drop-shadow(0 0 3px rgb(0,212,255))' }} />
            <text x={p.x} y={H + 16} textAnchor="middle" style={{ fill: '#414f6e', fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {dayLabels[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* Severity distribution bar */
export function SeverityChart({ reports }) {
  const severityCounts = [1, 2, 3, 4, 5].map(s => ({
    level: s,
    count: reports.filter(r => Number(r.severity) === s).length,
  }));
  const max = Math.max(...severityCounts.map(s => s.count), 1);
  const severityColors = ['rgb(0,255,135)', 'rgb(0,212,255)', 'rgb(255,170,0)', 'rgb(255,100,50)', 'rgb(255,61,87)'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '80px' }}>
      {severityCounts.map(({ level, count }, i) => (
        <div key={level} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7fa3' }}>{count}</div>
          <div
            style={{
              width: '100%',
              height: `${Math.max((count / max) * 60, 4)}px`,
              background: severityColors[i],
              borderRadius: '4px 4px 0 0',
              boxShadow: `0 0 6px ${severityColors[i]}60`,
              transition: 'height 600ms ease',
            }}
          />
          <div style={{ fontSize: '0.7rem', color: '#414f6e', fontFamily: 'JetBrains Mono, monospace' }}>S{level}</div>
        </div>
      ))}
    </div>
  );
}
