import React from 'react';
import { Link } from 'react-router-dom';

/**
 * AboutContactSection — Subtle About and Contact sections plus minimal footer.
 * Matches the navbar's "About" and "Contact" links.
 */
export default function AboutContactSection() {
  return (
    <section className="about-contact-section">
      <div className="about-contact-grid">
        {/* About */}
        <div id="about" className="about-box reveal">
          <span className="section-label">ABOUT CAMPUSCONNECT</span>
          <h3 className="section-heading">Designed for Modern Academics</h3>
          <p className="section-body">
            CampusConnect eliminates administrative fragmentation. By unifying timetables,
            attendance records, coursework, and departmental communications into a single
            synchronized layer, students and faculty spend less time coordinating and more
            time learning.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#818cf8', fontWeight: 500 }}>
            <span>Role-Isolated Security</span>
            <span>•</span>
            <span>Real-time Sync</span>
            <span>•</span>
            <span>Zero Clutter</span>
          </div>
        </div>

        {/* Contact */}
        <div id="contact" className="contact-box reveal">
          <span className="section-label">INSTITUTIONAL ACCESS</span>
          <h3 className="section-heading">Campus Administration & Support</h3>
          <p className="section-body">
            Are you an academic administrator or IT director looking to integrate
            CampusConnect with your university infrastructure? Connect with our systems team
            for verified credentials and enrollment.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <a
              href="mailto:support@campusconnect.edu"
              style={{
                fontSize: '0.86rem',
                color: '#f4f4f5',
                textDecoration: 'none',
                padding: '0.65rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'border-color 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            >
              support@campusconnect.edu
            </a>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              24/7 System Monitoring
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-left">
          <span className="landing-footer-text">
            © {new Date().getFullYear()} CampusConnect. All rights reserved.
          </span>
          <span className="landing-status-badge">
            <span className="landing-status-dot" />
            All Systems Operational
          </span>
        </div>

        <div className="landing-footer-links">
          <a href="#capabilities" className="landing-footer-link">
            Features
          </a>
          <a href="#about" className="landing-footer-link">
            About
          </a>
          <Link to="/login" className="landing-footer-link">
            Faculty Access
          </Link>
          <Link to="/login" className="landing-footer-link">
            Admin Portal
          </Link>
        </div>
      </footer>
    </section>
  );
}
