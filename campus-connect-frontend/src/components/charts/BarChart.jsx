/**
 * BarChart — Responsive SVG-based bar chart with tooltips, gridlines, and theme colors.
 */
import { useState } from 'react';

export default function BarChart({
  data = [],
  title = '',
  height = 260,
  barColor = 'var(--color-primary)',
  emptyMessage = 'No data available',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-empty">{emptyMessage}</div>
      </div>
    );
  }

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const width = 500;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...data.map((d) => d.value || 0), 5);
  // Nice step calculation
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((maxValue / tickCount) * i)
  );

  const barSlotWidth = chartWidth / data.length;
  const barWidth = Math.max(Math.min(barSlotWidth * 0.6, 45), 14);

  return (
    <div className="chart-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="chart-svg-container" style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis values */}
          {ticks.map((tick, idx) => {
            const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-text-secondary)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const val = item.value || 0;
            const barH = (val / maxValue) * chartHeight;
            const x = paddingLeft + idx * barSlotWidth + (barSlotWidth - barWidth) / 2;
            const y = paddingTop + chartHeight - barH;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 2)}
                  rx="4"
                  fill={item.color || (isHovered ? 'url(#barGradientHover)' : 'url(#barGradient)')}
                  style={{
                    transition: 'all 0.2s ease',
                    filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                  }}
                />

                {/* Value on top of bar on hover or if bar is tall enough */}
                {(isHovered || data.length <= 6) && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(y - 6, 15)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={isHovered ? 'var(--color-primary)' : 'var(--color-text)'}
                  >
                    {val}
                  </text>
                )}

                {/* X-Axis Category Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-text-secondary)"
                  style={{ fontWeight: isHovered ? '600' : 'normal' }}
                >
                  {item.label?.length > 9 ? item.label.slice(0, 8) + '…' : item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="chart-tooltip-badge">
            <span className="tooltip-title">{data[hoveredIndex].label}</span>
            <span className="tooltip-val">{data[hoveredIndex].value} {data[hoveredIndex].unit || ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
