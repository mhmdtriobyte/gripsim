import { memo } from 'react';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const ServoGauge = memo(function ServoGauge({
  label,
  pin,
  angle,
  color,
  frozen,
  noSignal,
  receiving,
  locked,
}) {
  const cx = 70;
  const cy = 62;
  const r = 50;
  const needleAngle = (angle / 180) * 180;
  const needleEnd = polarToCartesian(cx, cy, r - 8, needleAngle);

  const ticks = [];
  for (let i = 0; i <= 180; i += 30) {
    const outer = polarToCartesian(cx, cy, r + 4, i);
    const inner = polarToCartesian(cx, cy, r - 4, i);
    ticks.push(
      <line
        key={i}
        x1={outer.x}
        y1={outer.y}
        x2={inner.x}
        y2={inner.y}
        stroke="var(--text-dim)"
        strokeWidth={i % 90 === 0 ? 2 : 1}
      />
    );
    if (i % 45 === 0) {
      const labelPos = polarToCartesian(cx, cy, r + 14, i);
      ticks.push(
        <text
          key={`l${i}`}
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-dim)"
          fontSize="8"
          fontFamily="IBM Plex Mono"
        >
          {i}°
        </text>
      );
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase mb-1">
        {label} (Pin {pin})
      </div>
      <svg width="140" height="85" viewBox="0 0 140 85">
        <path
          d={describeArc(cx, cy, r, 0, 180)}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={describeArc(cx, cy, r, 0, needleAngle)}
          fill="none"
          stroke={locked ? 'var(--accent-orange)' : color}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={frozen || noSignal || locked ? 0.3 : 0.8}
        />
        {ticks}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={frozen ? 'var(--accent-red)' : locked ? 'var(--accent-orange)' : color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill={color} opacity="0.8"
          className={receiving ? 'pulse-glow' : ''} />
        {receiving && (
          <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color}
            strokeWidth="1" opacity="0.3" className="pulse-glow" />
        )}
      </svg>
      <div
        className="font-display text-base -mt-1"
        style={{
          color: frozen ? 'var(--accent-red)' : color,
          transition: 'color 150ms',
        }}
      >
        {angle}°
      </div>
      {frozen && (
        <div className="font-mono text-[10px] text-[var(--accent-red)] font-bold">
          FROZEN
        </div>
      )}
      {locked && !frozen && (
        <div className="font-mono text-[10px] text-[var(--accent-orange)] font-bold">
          LOCKED
        </div>
      )}
      {noSignal && !frozen && !locked && (
        <div className="font-mono text-[10px] text-[var(--text-dim)]">
          NO SIGNAL
        </div>
      )}
    </div>
  );
});

export default ServoGauge;
