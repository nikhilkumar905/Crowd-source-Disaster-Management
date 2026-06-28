import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiMail, FiZap, FiShield, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { icon: FiShield, label: 'Incidents Tracked', value: '2,400+', color: '#ff3d57' },
  { icon: FiUsers, label: 'Active Volunteers', value: '840+', color: '#00d4ff' },
  { icon: FiAlertCircle, label: 'Requests Fulfilled', value: '7,200+', color: '#00ff87' },
];



export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await login({ email, password });
      const to = location.state?.from?.pathname || '/dashboard';
      navigate(to, { replace: true });
    } catch {
      // toast shown by AuthContext
    }
  }


  return (
    <main style={{
      minHeight: '100svh',
      display: 'grid',
      gridTemplateColumns: 'clamp(0px,42%,520px) 1fr',
      background: 'rgb(8,12,20)',
      color: '#e8f0ff',
    }}>
      {/* ── Left Hero Panel ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, rgb(13,20,34) 0%, rgb(8,12,28) 100%)',
        borderRight: '1px solid rgba(30,42,70,0.5)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '2.5rem 2rem',
      }} className="hidden lg:flex">
        {/* Grid mesh */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(168,85,247,0.15))',
              border: '1px solid rgba(0,212,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,212,255,0.15)',
            }}>
              <FiZap size={20} color="#00d4ff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                NEXUS<span style={{ color: '#00d4ff' }}>.</span>RESPONSE
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#414f6e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Emergency Coordination Platform
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Coordinate<br />
            <span style={{ color: '#00d4ff' }}>faster</span> when<br />
            it matters most.
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7fa3', lineHeight: 1.7, maxWidth: '340px' }}>
            Real-time incident reporting, resource dispatch, and volunteer coordination — unified in one tactical dashboard.
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {STATS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.85rem 1rem', borderRadius: '12px',
              background: 'rgba(17,26,46,0.5)', border: '1px solid rgba(30,42,70,0.5)',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}16`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#e8f0ff' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7fa3' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Right Form Panel ── */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', minHeight: '100svh' }}>
        <div style={{ width: '100%', maxWidth: '420px', animation: 'fade-up 400ms ease both' }}>

          {/* Mobile logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '2rem' }} className="lg:hidden">
            <FiZap size={20} color="#00d4ff" />
            <span style={{ fontWeight: 800, color: '#e8f0ff' }}>NEXUS<span style={{ color: '#00d4ff' }}>.</span>RESPONSE</span>
          </Link>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Operator Access
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#e8f0ff' }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7fa3', marginTop: '0.35rem', lineHeight: 1.6 }}>
                Sign in to access the role-based coordination console.
              </p>
            </div>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="nx-label" htmlFor="login-email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <FiMail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#414f6e', pointerEvents: 'none' }} />
                  <input id="login-email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                    className="nx-input" style={{ paddingLeft: '2.4rem' }} />
                </div>
              </div>

              <div>
                <label className="nx-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#414f6e', pointerEvents: 'none' }} />
                  <input id="login-password" type={showPw ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    className="nx-input" style={{ paddingLeft: '2.4rem', paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#414f6e', padding: 0 }}>
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading || !!demoLoading}
                className="glow-btn glow-btn--solid-cyan"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                {loading ? <><span className="spinner" style={{ borderTopColor: 'rgb(8,12,20)', borderColor: 'rgba(8,12,20,0.3)' }} /><span>Signing in...</span></> : 'Sign in to console'}
              </button>
            </form>

            <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#6b7fa3' }}>
              New to the network?{' '}
              <Link to="/register" style={{ color: '#00d4ff', fontWeight: 700, textDecoration: 'none' }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
