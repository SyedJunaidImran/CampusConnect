/**
 * DonutChart — Responsive SVG-based donut/pie chart with percentage legend and center summary.
 */
import { useState } from 'react';

export default function DonutChart({
  data = [],
  title = '',
  size = 220,
  strokeWidth = 26,
  emptyMessage = 'No data available',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="chart-card">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-empty">{emptyMessage}</div>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="chart-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="donut-chart-container">
        <div className="donut-svg-wrapper" style={{ width: size, height: size, position: 'relative' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--color-border)"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {data.map((item, idx) => {
              const val = item.value || 0;
              const sliceRatio = total > 0 ? val / total : 0;
              const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += sliceRatio * circumference;

              const isHovered = hoveredIndex === idx;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color || 'var(--color-primary)'}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    cursor: 'pointer',
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1,
                  }}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="donut-center-text">
            <span className="donut-center-val">
              {hoveredIndex !== null ? data[hoveredIndex].value : total}
            </span>
            <span className="donut-center-label">
              {hoveredIndex !== null ? data[hoveredIndex].label : 'Total'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="donut-legend">
          {data.map((item, idx) => {
            const pct = total > 0 ? Math.round(((item.value || 0) / total) * 100) : 0;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                className={`donut-legend-item ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="legend-dot" style={{ backgroundColor: item.color }} />
                <span className="legend-name">{item.label}</span>
                <span className="legend-val">{item.value} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
