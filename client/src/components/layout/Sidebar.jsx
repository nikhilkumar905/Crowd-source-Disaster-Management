/* eslint-disable react-refresh/only-export-components */
import { createElement } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiAlertCircle, FiActivity, FiLogOut, FiMenu,
  FiShield, FiUsers, FiZap,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLORS = {
  Citizen: 'rgb(var(--amber))',
  Volunteer: 'rgb(var(--cyan))',
  Admin: 'rgb(var(--purple))',
};

export function navItemsForRole(role) {
  const items = [];

  if (role === 'Citizen') {
    items.push({ to: '/citizen', icon: FiActivity, label: 'Overview', end: true });
    items.push({ to: '/citizen?tab=activity', icon: FiAlertCircle, label: 'My Reports & Aid' });
  }
  if (role === 'Volunteer') {
    items.push({ to: '/volunteer', icon: FiActivity, label: 'Overview', end: true });
    items.push({ to: '/volunteer?tab=map', icon: FiZap, label: 'Field Operations' });
  }
  if (role === 'Admin') {
    items.push({ to: '/admin?tab=overview', icon: FiActivity, label: 'Overview' });
    items.push({ to: '/admin?tab=map', icon: FiShield, label: 'Command Center' });
    items.push({ to: '/admin?tab=users', icon: FiUsers, label: 'User Management' });
  }

  return items;
}

function Item({ to, icon: Icon, label, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
    >
      {createElement(Icon, { size: 17 })}
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarBody({ role, onNavigate }) {
  const { user, logout } = useAuth();
  const items = navItemsForRole(role);
  const roleColor = ROLE_COLORS[role] || 'rgb(var(--cyan))';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(var(--border)/0.5)' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(var(--cyan)/0.3), rgba(var(--purple)/0.2))',
          border: '1px solid rgba(var(--cyan)/0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(var(--cyan)/0.2)',
        }}>
          <FiZap size={18} color="rgb(var(--cyan))" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '-0.02em', color: 'rgb(var(--text-1))' }}>
            NEXUS<span style={{ color: 'rgb(var(--cyan))' }}>.</span>
          </div>
          <div className="mono" style={{ fontSize: '0.6rem', color: 'rgb(var(--text-3))', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Response Platform
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{
        padding: '0.75rem',
        borderRadius: '12px',
        background: 'rgba(var(--s700)/0.6)',
        border: '1px solid rgba(var(--border)/0.5)',
        display: 'flex', alignItems: 'center', gap: '0.7rem',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: `${roleColor}22`,
          border: `1px solid ${roleColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', fontWeight: 800, color: roleColor,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgb(var(--text-1))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, color: roleColor,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {items.map((item) => (
          <Item key={item.to + item.label} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Logout */}
      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(var(--border)/0.5)' }}>
        <button
          type="button"
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            width: '100%', padding: '0.5rem 0.9rem',
            borderRadius: '10px', border: 'none',
            background: 'none', color: 'rgb(var(--text-2))',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
            transition: 'color 150ms ease, background 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--red)/0.08)'; e.currentTarget.style.color = 'rgb(var(--red))'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgb(var(--text-2))'; }}
        >
          <FiLogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export function MobileNavTrigger({ onClick }) {
  return (
    <button type="button" className="glow-btn glow-btn--ghost" onClick={onClick} aria-label="Open navigation"
      style={{ padding: '0.5rem 0.65rem' }}
    >
      <FiMenu size={18} />
    </button>
  );
}

export default function Sidebar({ mobile = false, onNavigate }) {
  const { user } = useAuth();
  const role = user?.role;
  if (!role && !mobile) return null;

  return (
    <aside
      className={mobile ? '' : 'hidden md:flex'}
      style={{
        display: mobile ? 'flex' : undefined,
        width: mobile ? '100%' : '240px',
        height: mobile ? '100%' : '100svh',
        padding: '1.25rem',
        background: mobile ? 'rgba(var(--s800)/0.95)' : 'rgba(var(--s800)/0.97)',
        backdropFilter: mobile ? 'blur(20px)' : 'blur(24px)',
        WebkitBackdropFilter: mobile ? 'blur(20px)' : 'blur(24px)',
        flexShrink: 0,
        position: mobile ? 'relative' : 'sticky',
        top: 0,
        borderRight: '1px solid rgba(var(--border)/0.5)',
        overflowY: 'auto',
        ...(mobile ? {} : {
          display: 'none',
          ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { display: 'flex' } : {}),
        })
      }}
    >
      <SidebarBody role={role} onNavigate={onNavigate} />
    </aside>
  );
}
