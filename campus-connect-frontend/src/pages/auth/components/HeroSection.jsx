import React from 'react';
import { Link } from 'react-router-dom';

/**
 * HeroSection — Minimalist, confident product hero section.
 * Headline: "Your Campus, Connected."
 * Supporting text: Brings students, faculty, courses, schedules, attendance, assignments, and campus activities together.
 * Dual CTAs: "Get Started" and "Sign In".
 */
export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          Modern Academic Infrastructure
        </div>

        <h1 className="hero-title">
          Your Campus,<br />
          <span className="hero-title-accent">Connected.</span>
        </h1>

        <p className="hero-subtitle">
          CampusConnect brings students, faculty, courses, schedules,
          attendance, assignments, and campus activities into one unified,
          beautifully connected platform.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="hero-cta hero-cta--primary">
            <span>Get Started</span>
            <span className="hero-cta-arrow">→</span>
          </Link>
          <Link to="/login" className="hero-cta hero-cta--secondary">
            <span>Sign In</span>
          </Link>
        </div>

        {/* Technical specs pill */}
        <div
          style={{
            marginTop: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.72rem',
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.08em',
          }}
        >
          <span>REAL-TIME ENGINE</span>
          <span>•</span>
          <span>SMART TIMETABLE</span>
          <span>•</span>
          <span>ENTERPRISE GRADE</span>
        </div>
      </div>

      <div className="hero-scroll">
        <div className="hero-scroll-line" />
        <span>EXPLORE PLATFORM</span>
      </div>
    </section>
  );
}
