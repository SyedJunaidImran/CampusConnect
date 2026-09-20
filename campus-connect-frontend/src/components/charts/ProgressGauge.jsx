/**
 * ProgressGauge — Circular attendance/completion gauge with threshold indicator (75%).
 */
export default function ProgressGauge({
  value = 0,
  threshold = 75,
  label = 'Attendance Rate',
  subLabel = '',
  size = 180,
  strokeWidth = 16,
}) {
  const numericVal = Math.min(Math.max(Number(value) || 0, 0), 100);
  const isBelow = numericVal < threshold;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericVal / 100) * circumference;

  const color = isBelow ? 'var(--color-danger)' : 'var(--color-success)';

  return (
    <div className="gauge-container">
      <div className="gauge-svg-wrapper" style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>

        {/* Center Percentage */}
        <div className="gauge-center-content">
          <span className="gauge-value" style={{ color }}>{numericVal}%</span>
          <span className="gauge-label">{label}</span>
        </div>
      </div>

      <div className="gauge-footer">
        <div className={`gauge-badge ${isBelow ? 'badge-danger' : 'badge-success'}`}>
          {isBelow ? `⚠ Below Required ${threshold}%` : `✔ Above Required ${threshold}%`}
        </div>
        {subLabel && <span className="gauge-sublabel">{subLabel}</span>}
      </div>
    </div>
  );
}
