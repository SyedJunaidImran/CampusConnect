import React, { useState } from 'react';

/**
 * InterfaceShowcase — Immersive spatial perspective interface showcase.
 * Tilted 3D presentation of the CampusConnect Timetable & Academic Workspace.
 * Depth layers, soft shadows, realistic materials, and subtle mouse-reactive elevation.
 */
export default function InterfaceShowcase() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const rotX = 10 - mousePos.y * 6;
  const rotY = -6 + mousePos.x * 6;

  return (
    <section
      id="interface"
      style={{
        padding: '6rem 3rem 10rem',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
        <span
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#818cf8',
            fontWeight: 600,
            display: 'block',
            marginBottom: '0.75rem',
          }}
        >
          03 / ELEVATED EXPERIENCE
        </span>
        <h2
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
            fontWeight: 700,
            color: '#f5f5f0',
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}
        >
          Engineered for clarity at every glance.
        </h2>
        <p
          style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.4)',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          The redesigned timetable and academic timeline. Pure signal, zero clutter.
        </p>
      </div>

      {/* 3D Perspective Stage */}
      <div
        style={{
          perspective: '1400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1040px',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(0.96)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(25, 25, 35, 0.85) 0%, rgba(12, 12, 18, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow:
              '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            padding: '2rem 2.5rem',
            position: 'relative',
          }}
        >
          {/* Top Window Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginLeft: '0.75rem',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                CampusConnect • Academic Schedule & Timetable
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.72rem',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                LIVE SESSION ACTIVE
              </span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Term 6 • Fall 2026
              </span>
            </div>
          </div>

          {/* Today's Highlight Hero Strip */}
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.02) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '10px',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: '#818cf8', fontWeight: 600 }}>
                HAPPENING NOW (10:00 AM – 11:30 AM)
              </div>
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#f5f5f0',
                  marginTop: '0.2rem',
                }}
              >
                CS401: Distributed Cloud Architecture
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.2rem' }}>
                Prof. David Vance • Lecture Hall B-204 • Attendance: 92% Verified
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.75rem',
                  color: '#f5f5f0',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.68rem' }}>NEXT UP</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>AI Systems (01:00 PM)</div>
              </div>
            </div>
          </div>

          {/* Schedule Grid Simulation */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1rem',
              fontSize: '0.8rem',
            }}
          >
            {[
              { day: 'MONDAY', classes: ['CS401 Distributed', 'CS405 Compiler Tech', 'Lab: Networking'] },
              { day: 'TUESDAY', classes: ['CS408 Machine Learning', 'MATH302 Statistics', 'Library Study'] },
              { day: 'WEDNESDAY', classes: ['CS401 Distributed', 'CS412 Cybersecurity', 'Seminar Room A'] },
              { day: 'THURSDAY', classes: ['CS408 Machine Learning', 'Lab: Cloud Systems', 'Faculty Hours'] },
              { day: 'FRIDAY', classes: ['Project Capstone', 'Elective: Quantum', 'Open Discussion'] },
            ].map((col, i) => (
              <div
                key={col.day}
                style={{
                  background: i === 2 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: i === 2 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.1em',
                    color: i === 2 ? '#818cf8' : 'rgba(255, 255, 255, 0.35)',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                  }}
                >
                  {col.day} {i === 2 && '• TODAY'}
                </div>
                {col.classes.map((c, j) => (
                  <div
                    key={j}
                    style={{
                      padding: '0.5rem 0.6rem',
                      borderRadius: '6px',
                      background: j === 0 && i === 2 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      marginBottom: '0.5rem',
                      fontSize: '0.74rem',
                      color: j === 0 && i === 2 ? '#e0e7ff' : 'rgba(255, 255, 255, 0.7)',
                      borderLeft: j === 0 && i === 2 ? '2px solid #6366f1' : 'none',
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Understated status strip */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.35)',
            }}
          >
            <span>SYNCHRONIZED WITH UNIVERSITY ERP BACKEND</span>
            <span>END-TO-END ENCRYPTED JWT SESSION</span>
          </div>
        </div>
      </div>
    </section>
  );
}
