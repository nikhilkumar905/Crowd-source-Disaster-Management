import { Link } from 'react-router-dom';
import { FiArrowRight, FiActivity, FiGlobe, FiShield, FiZap, FiTarget } from 'react-icons/fi';

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div style={{
      background: 'rgba(var(--s800)/0.6)',
      border: '1px solid rgba(var(--border)/0.5)',
      borderRadius: '16px',
      padding: '2rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      transition: 'all 200ms ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(var(--cyan)/0.3)';
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(var(--border)/0.5)';
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'rgba(var(--cyan)/0.1)', border: '1px solid rgba(var(--cyan)/0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--cyan))'
      }}>
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'rgb(var(--text-1))' }}>{title}</h3>
      <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-2))', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

export default function HeroPage() {
  return (
    <div style={{ minHeight: '100svh', background: 'rgb(var(--s900))', color: 'rgb(var(--text-1))', overflow: 'hidden' }}>
      
      {/* Navbar */}
      <nav style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.5rem 5%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(var(--cyan)/0.3), rgba(var(--purple)/0.2))', border: '1px solid rgba(var(--cyan)/0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(var(--cyan)/0.2)' }}>
            <FiZap size={20} color="rgb(var(--cyan))" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            NEXUS<span style={{ color: 'rgb(var(--cyan))' }}>.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="glow-btn glow-btn--ghost" style={{ textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" className="glow-btn glow-btn--solid-cyan" style={{ textDecoration: 'none' }}>Get Access</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8rem 5% 4rem',
      }}>
        {/* Animated Mesh BG */}
        <div className="hero-mesh" style={{ position: 'absolute', inset: 0, opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--cyan)/0.08), transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--purple)/0.06), transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fade-up 600ms ease both' }}>
          <div className="neon-badge neon-badge--cyan" style={{ marginBottom: '2rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse-ring 1s infinite' }} />
            Live Coordination Network
          </div>
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Tactical Response <br />
            <span style={{ background: 'linear-gradient(135deg, rgb(var(--cyan)), rgb(var(--purple)))', WebkitBackgroundClip: 'text', color: 'transparent' }}>When Seconds Count.</span>
          </h1>
          
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgb(var(--text-2))', lineHeight: 1.6, maxWidth: '640px', marginBottom: '3rem' }}>
            NEXUS is a real-time command platform unifying citizen reports, volunteer dispatch, and administrative oversight into one seamless grid.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="glow-btn glow-btn--solid-cyan" style={{ padding: '1rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
              Launch Console <FiArrowRight />
            </Link>
            <a href="#features" className="glow-btn glow-btn--ghost" style={{ padding: '1rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
              Explore Capabilities
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '6rem 5%', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="section-eyebrow" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Platform Capabilities</h2>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Built for the Frontline</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <FeatureCard 
              icon={FiGlobe} 
              title="Live Density Heatmaps" 
              desc="Visualize crisis zones in real-time. Administrative overlays dynamically render heat density based on active incident volume and severity." 
            />
            <FeatureCard 
              icon={FiActivity} 
              title="Real-Time Analytics" 
              desc="Make data-driven dispatch decisions with live SVG analytics dashboards charting incident distribution, status, and network load." 
            />
            <FeatureCard 
              icon={FiTarget} 
              title="Tactical Volunteer Dispatch" 
              desc="Volunteers define their operational radius dynamically on the map and configure their available skillsets (Medical, Driving, Search) for precise tasking." 
            />
            <FeatureCard 
              icon={FiShield} 
              title="Socket Broadcast Alerts" 
              desc="Admins can trigger system-wide emergency broadcast alerts that instantly ping all connected field units and citizens via WebSockets." 
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 5%', borderTop: '1px solid rgba(var(--border)/0.5)', textAlign: 'center', position: 'relative', zIndex: 1, color: 'rgb(var(--text-3))' }}>
        <div className="mono" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          NEXUS Response Platform &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
