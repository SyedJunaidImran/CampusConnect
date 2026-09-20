import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * LandingNav — Minimal, premium top navigation bar.
 * Wordmark + anchor links (Features, About, Contact) + Sign In & Get Started CTAs.
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
      <Link to="/" className="landing-nav-logo">
        <span className="landing-nav-logo-dot" />
        CampusConnect
      </Link>

      <nav className="landing-nav-center" aria-label="Main Navigation">
        <a href="#capabilities" className="landing-nav-link">
          Features
        </a>
        <a href="#about" className="landing-nav-link">
          About
        </a>
        <a href="#contact" className="landing-nav-link">
          Contact
        </a>
      </nav>

      <div className="landing-nav-actions">
        <Link to="/login" className="landing-nav-btn landing-nav-btn--ghost">
          Sign In
        </Link>
        <Link to="/register" className="landing-nav-btn landing-nav-btn--primary">
          Get Started
        </Link>
      </div>
    </header>
  );
}
