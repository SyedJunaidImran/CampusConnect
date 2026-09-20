import React from 'react';
import { Link } from 'react-router-dom';

/**
 * FooterCTA — Direct, confident closing section with minimal footer.
 */
export default function FooterCTA() {
  return (
    <footer className="footer-cta">
      <div className="reveal" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <span
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#818cf8',
            fontWeight: 600,
            display: 'block',
            marginBottom: '1rem',
          }}
        >
          04 / ACCESS
        </span>
        <h2 className="footer-cta-title">
          Ready to elevate your campus experience?
        </h2>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.25rem',
            marginBottom: '6rem',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/register" className="hero-cta">
            <span>Create Student Account</span>
            <span className="hero-cta-arrow">→</span>
          </Link>
          <Link
            to="/login"
            style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              padding: '0.9rem 1.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              transition: 'all 0.25s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.color = '#f5f5f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            Sign In Existing
          </Link>
        </div>
      </div>

      <div className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span className="landing-footer-text">
            © {new Date().getFullYear()} CampusConnect. All rights reserved.
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            All Systems Operational
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <Link
            to="/login"
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255, 255, 255, 0.35)',
              textDecoration: 'none',
            }}
          >
            Faculty Portal
          </Link>
          <Link
            to="/login"
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255, 255, 255, 0.35)',
              textDecoration: 'none',
            }}
          >
            Admin Access
          </Link>
          <a
            href="#pillars"
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255, 255, 255, 0.35)',
              textDecoration: 'none',
            }}
          >
            Architecture
          </a>
        </div>
      </div>
    </footer>
  );
}
