import React from 'react';

/**
 * CapabilitiesSection — Subtle supporting content directly below the hero.
 * Headline: "Everything your campus needs, connected."
 * 4 concise capabilities with elegant minimal visual treatments:
 * 1. Smart Timetables
 * 2. Attendance
 * 3. Assignments
 * 4. Faculty & Student Collaboration
 */
export default function CapabilitiesSection() {
  const capabilities = [
    {
      num: '01',
      title: 'Smart Timetables',
      desc: 'Interactive schedule grid with real-time room tracking, faculty allocation, and live lecture status indicators.',
    },
    {
      num: '02',
      title: 'Attendance',
      desc: 'Automated subject-by-subject percentage calculation, safe absence thresholds, and instant attendance alerts.',
    },
    {
      num: '03',
      title: 'Assignments',
      desc: 'Seamless coursework distribution, digital file submissions, deadline countdowns, and evaluation pipelines.',
    },
    {
      num: '04',
      title: 'Faculty & Student Collaboration',
      desc: 'Direct communication channels, verified departmental announcements, and shared course repositories.',
    },
  ];

  return (
    <section id="capabilities" className="capabilities-section">
      <div className="capabilities-header reveal">
        <span className="capabilities-tag">CORE CAPABILITIES</span>
        <h2 className="capabilities-title">
          Everything your campus needs, connected.
        </h2>
        <p className="capabilities-sub">
          A cohesive digital ecosystem built for speed, simplicity, and quiet focus.
        </p>
      </div>

      <div className="capabilities-grid">
        {capabilities.map((item) => (
          <div key={item.num} className="capability-card reveal">
            <div className="capability-card-num">{item.num}</div>
            <h3 className="capability-card-title">{item.title}</h3>
            <p className="capability-card-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
