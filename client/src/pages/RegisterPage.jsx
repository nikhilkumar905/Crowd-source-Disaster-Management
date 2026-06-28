import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiZap, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const roles = ['Citizen', 'Volunteer'];

const roleMeta = {
  Citizen: {
    icon: FiAlertCircle,
    color: 'rgb(var(--amber))',
    desc: 'Report incidents, request aid, and track real-time response to your location.',
    perks: ['Submit disaster reports', 'Request food, water, shelter', 'Track assigned volunteers'],
  },
  Volunteer: {
    icon: FiCheckCircle,
    color: 'rgb(var(--cyan))',
    desc: 'Accept nearby relief requests, update field status, and coordinate with admin.',
    perks: ['See nearby requests', 'Accept & complete assignments', 'Set skills & availability'],
  },
};

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [showPw, setShowPw] = useState(false);

  const meta = roleMeta[role];
  const RoleIcon = meta.icon;

  async function onSubmit(e) {
    e.preventDefault();
    await register({ name, email, password, role });
    navigate('/dashboard');
  }

  return (
    <main style={{
      minHeight: '100svh',
      background: 'rgb(var(--s900))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
      color: 'rgb(var(--text-1))',
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'fixed', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(var(--cyan)/0.06), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '960px', display: 'grid', gridTemplateColumns: 'clamp(0px,40%,400px) 1fr', gap: '1.5rem', animation: 'fade-up 400ms ease both' }} className="lg:grid">

        {/* Left: Role picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="hidden lg:flex">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', marginBottom: '0.5rem' }}>
            <FiZap size={20} color="rgb(var(--cyan))" />
            <span style={{ fontWeight: 800, color: 'rgb(var(--text-1))', fontSize: '0.95rem' }}>
              NEXUS<span style={{ color: 'rgb(var(--cyan))' }}>.</span>RESPONSE
            </span>
          </Link>

          <h1 style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Join the<br />
            <span style={{ color: 'rgb(var(--cyan))' }}>response</span> network.
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-2))', lineHeight: 1.7 }}>
            Choose your role to unlock the right tools for your position in the field.
          </p>

          {/* Role selector cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {roles.map(r => {
              const m = roleMeta[r];
              const Icon = m.icon;
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: '1rem', borderRadius: '14px', textAlign: 'left',
                    background: isSelected ? `${m.color}10` : 'rgba(var(--s800)/0.7)',
                    border: `1px solid ${isSelected ? m.color + '40' : 'rgba(var(--border)/0.5)'}`,
                    cursor: 'pointer', transition: 'all 180ms ease',
                    boxShadow: isSelected ? `0 0 20px ${m.color}15` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                    <Icon size={16} color={m.color} />
                    <span style={{ fontWeight: 700, color: isSelected ? m.color : 'rgb(var(--text-1))', fontSize: '0.875rem' }}>{r}</span>
                    {isSelected && <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'rgb(var(--text-2))', lineHeight: 1.5 }}>{m.desc}</p>
                  <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {m.perks.map(perk => (
                      <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.73rem', color: 'rgb(var(--text-3))' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                        {perk}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Form */}
        <div className="glass-card" style={{ padding: '2rem', alignSelf: 'start' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <RoleIcon size={15} color={meta.color} />
              <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 700, color: meta.color, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                New {role} Account
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'rgb(var(--text-1))' }}>
              Create your account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-2))', marginTop: '0.3rem', lineHeight: 1.6 }}>
              Start coordinating disaster response immediately after registration.
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Mobile role select */}
            <div className="lg:hidden">
              <label className="nx-label">Account role</label>
              <select className="nx-input" value={role} onChange={e => setRole(e.target.value)}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="nx-label" htmlFor="reg-name">Full name</label>
                <div style={{ position: 'relative' }}>
                  <FiUser size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--text-3))', pointerEvents: 'none' }} />
                  <input id="reg-name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required className="nx-input" style={{ paddingLeft: '2.4rem' }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="nx-label" htmlFor="reg-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <FiMail size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--text-3))', pointerEvents: 'none' }} />
                  <input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="nx-input" style={{ paddingLeft: '2.4rem' }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="nx-label" htmlFor="reg-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--text-3))', pointerEvents: 'none' }} />
                  <input id="reg-password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required className="nx-input" style={{ paddingLeft: '2.4rem', paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-3))', padding: 0 }}>
                    {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role preview */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RoleIcon size={13} color={meta.color} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>{role} capabilities unlocked</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgb(var(--text-2))', marginTop: '0.25rem', lineHeight: 1.5 }}>{meta.desc}</p>
            </div>

            <button type="submit" disabled={loading} className="glow-btn glow-btn--solid-cyan" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
              {loading ? <><span className="spinner" style={{ borderTopColor: 'rgb(var(--s900))', borderColor: 'rgba(var(--s900)/0.3)' }} /><span>Creating account...</span></> : `Create ${role} account →`}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgb(var(--text-2))' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'rgb(var(--cyan))', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
