import React from 'react';

/**
 * FeaturesSection — Editorial narrative, 3 Core Pillars, and capabilities index.
 * Clean grid alignments, restrained aesthetic, confident negative space.
 */
export default function FeaturesSection() {
  const pillars = [
    {
      num: '01',
      title: 'Unified Academic Flow',
      subtitle: 'Synchronized across schedule, courses, and attendance',
      description:
        'A single source of truth for your daily academic routine. Live timetable awareness surfaces your current lecture, faculty status, and room allocation without friction.',
      tags: ['Interactive Timetable', 'Attendance Engine', 'Course Registry'],
    },
    {
      num: '02',
      title: 'Real-time Campus Intelligence',
      subtitle: 'Instant distributed updates & verified academic metrics',
      description:
        'Eliminate communication lags. Broadcast urgent departmental notices, monitor aggregate attendance thresholds, and access performance analytics in real-time.',
      tags: ['Verified Announcements', 'Grade Analytics', 'Notice Pipeline'],
    },
    {
      num: '03',
      title: 'Frictionless Collaboration',
      subtitle: 'Engineered for Students, Faculty, and Administrators',
      description:
        'Role-segmented permissions with interconnected workflows. Faculty submit schedules and coursework while students engage and review seamlessly.',
      tags: ['Role Isolation', 'Direct Feedback', 'Academic Portal'],
    },
  ];

  const capabilities = [
    { name: 'Courses', detail: 'Syllabus, modules & enrolled rosters' },
    { name: 'Attendance', detail: 'Per-subject tracking & threshold alerts' },
    { name: 'Assignments', detail: 'Digital submissions & deadline pipelines' },
    { name: 'Timetable V2', detail: 'Weekly grid & live class indicators' },
    { name: 'Study Materials', detail: 'Departmental notes & resource archives' },
    { name: 'Announcements', detail: 'Instant urgent notices & broadcast feeds' },
    { name: 'Messaging', detail: 'Direct student-faculty dialogue' },
    { name: 'Analytics', detail: 'Comprehensive semester performance insights' },
  ];

  return (
    <section id="pillars" className="features">
      {/* Editorial Header */}
      <div className="reveal" style={{ marginBottom: '6rem' }}>
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
          02 / ARCHITECTURAL PILLARS
        </span>
        <h2 className="features-headline">
          Everything your campus needs.
          <br />
          Nothing it doesn't.
        </h2>
        <p className="features-sub">
          Engineered as a cohesive system rather than fragmented utilities.
        </p>
      </div>

      {/* The 3 Core Pillars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem',
          marginBottom: '8rem',
        }}
      >
        {pillars.map((pillar) => (
          <div
            key={pillar.num}
            className="reveal"
            style={{
              padding: '2.5rem 2rem',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.015)',
              position: 'relative',
              transition: 'border-color 0.3s ease, transform 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.85rem',
                color: '#818cf8',
                fontWeight: 700,
                letterSpacing: '0.1em',
                marginBottom: '1.25rem',
              }}
            >
              {pillar.num}
            </div>
            <h3
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#f5f5f0',
                letterSpacing: '-0.02em',
                marginBottom: '0.5rem',
              }}
            >
              {pillar.title}
            </h3>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              {pillar.subtitle}
            </p>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.7,
                marginBottom: '2rem',
              }}
            >
              {pillar.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pillar.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities Index */}
      <div id="features" className="reveal" style={{ marginTop: '4rem' }}>
        <span
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.4)',
            display: 'block',
            marginBottom: '1.5rem',
          }}
        >
          CORE CAPABILITIES INDEX
        </span>

        <div className="features-grid reveal-stagger">
          {capabilities.map((cap) => (
            <div key={cap.name} className="feature-item">
              <div className="feature-dot" />
              <div className="feature-name">{cap.name}</div>
              <div
                style={{
                  fontSize: '0.76rem',
                  color: 'rgba(255, 255, 255, 0.35)',
                  marginTop: '0.35rem',
                  lineHeight: 1.4,
                }}
              >
                {cap.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
