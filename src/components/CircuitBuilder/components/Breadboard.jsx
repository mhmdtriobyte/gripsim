import { memo } from 'react';

export const BREADBOARD_PINS = [
  { id: 'PWR+', x: 10, y: 10, type: 'power', label: '+' },
  { id: 'PWR-', x: 10, y: 70, type: 'gnd', label: '-' },
];

const Breadboard = memo(function Breadboard({ onPinClick, id }) {
  const rows = 5;
  const cols = 10;

  return (
    <g>
      <defs>
        <filter id={`shadow-breadboard-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#e8e8d8" floodOpacity="0.5"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="160" height="80" rx="3" fill="#e8e8d8" stroke="#ccc" strokeWidth="1" filter={`url(#shadow-breadboard-${id})`} />

      <line x1="5" y1="12" x2="155" y2="12" stroke="#ff3333" strokeWidth="1" opacity="0.5" />
      <line x1="5" y1="68" x2="155" y2="68" stroke="#3333ff" strokeWidth="1" opacity="0.5" />

      {Array.from({ length: cols }).map((_, col) =>
        Array.from({ length: rows }).map((_, row) => (
          <rect
            key={`t${col}-${row}`}
            x={20 + col * 13}
            y={20 + row * 5}
            width="4"
            height="4"
            rx="0.5"
            fill="#bbb"
            stroke="#999"
            strokeWidth="0.3"
          />
        ))
      )}

      <line x1="5" y1="40" x2="155" y2="40" stroke="#ccc" strokeWidth="0.5" strokeDasharray="2 2" />

      {Array.from({ length: cols }).map((_, col) =>
        Array.from({ length: rows }).map((_, row) => (
          <rect
            key={`b${col}-${row}`}
            x={20 + col * 13}
            y={45 + row * 5}
            width="4"
            height="4"
            rx="0.5"
            fill="#bbb"
            stroke="#999"
            strokeWidth="0.3"
          />
        ))
      )}

      {BREADBOARD_PINS.map((pin) => (
        <circle
          key={pin.id}
          cx={pin.x} cy={pin.y} r="4"
          fill={pin.type === 'power' ? '#ff4444' : '#4444ff'}
          stroke={pin.type === 'power' ? '#ff6666' : '#6666ff'}
          strokeWidth="0.5"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onPinClick?.(id, pin.id, pin.x, pin.y); }}
        />
      ))}
    </g>
  );
});

export default Breadboard;
