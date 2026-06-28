import { createElement } from 'react';
import clsx from 'clsx';
import { priorityTone, statusTone } from './dashboardTones';

export function DashboardHero({ eyebrow, title, copy, accent = 'citizen', children }) {
  return (
    <section className={clsx('dashboard-hero', `dashboard-hero--${accent}`)}>
      <div className="dashboard-hero__mesh" />
      <div className="dashboard-hero__content">
        <div className="max-w-3xl">
          {eyebrow && <p className="ops-mono dashboard-hero__eyebrow">{eyebrow}</p>}
          <h1 className="dashboard-hero__title">{title}</h1>
          {copy && <p className="dashboard-hero__copy">{copy}</p>}
        </div>
        {children && <div className="dashboard-hero__aside">{children}</div>}
      </div>
    </section>
  );
}

export function MetricCard({ label, value, detail, icon, tone = 'neutral' }) {
  return (
    <div className={clsx('metric-card', `metric-card--${tone}`)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="metric-card__label">{label}</div>
          <div className="metric-card__value">{value}</div>
          {detail && <div className="metric-card__detail">{detail}</div>}
        </div>
        {icon && <div className="metric-card__icon">{createElement(icon)}</div>}
      </div>
    </div>
  );
}

export function DashboardSection({ eyebrow, title, copy, action, children, className = '' }) {
  return (
    <section className={clsx('section-shell', className)}>
      {(eyebrow || title || copy || action) && (
        <div className="section-shell__header">
          <div>
            {eyebrow && <div className="section-shell__eyebrow">{eyebrow}</div>}
            {title && <h2 className="section-shell__title">{title}</h2>}
            {copy && <p className="section-shell__copy">{copy}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ value, className = '' }) {
  return (
    <span className={clsx('status-badge', `status-badge--${statusTone(value)}`, className)}>
      {value}
    </span>
  );
}

export function PriorityBadge({ value, className = '' }) {
  const priority = Number(value) || 3;
  return (
    <span className={clsx('status-badge', `status-badge--${priorityTone(priority)}`, className)}>
      Priority {priority}
    </span>
  );
}

export function EmptyState({ title, copy, className = '' }) {
  return (
    <div className={clsx('empty-state', className)}>
      <div className="font-black">{title}</div>
      <div className="mt-1 text-sm text-[rgb(var(--muted))]">{copy}</div>
    </div>
  );
}

export function TimelineList({ items, empty }) {
  if (!items.length) return empty || null;

  return (
    <div className="timeline-list">
      {items.map((item) => (
        <div key={item.id} className="timeline-list__item">
          <div className="timeline-list__rail" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-black text-[rgb(var(--ink))]">{item.title}</div>
                {item.copy && <div className="mt-1 text-sm text-[rgb(var(--muted))]">{item.copy}</div>}
              </div>
              {item.meta && <div className="ops-mono text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{item.meta}</div>}
            </div>
            {item.footer && <div className="mt-3">{item.footer}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
