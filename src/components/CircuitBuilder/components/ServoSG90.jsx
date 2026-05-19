import { memo } from 'react';

export const SERVO_PINS = [
  { id: 'VCC', x: 20, y: 75, type: 'power', label: 'VCC' },
  { id: 'GND', x: 40, y: 75, type: 'gnd', label: 'GND' },
  { id: 'Signal', x: 60, y: 75, type: 'signal', label: 'SIG' },
];

const ServoSG90 = memo(function ServoSG90({ onPinClick, id, angle = 90 }) {
  const hornAngle = ((angle || 90) - 90);

  return (
    <g>
      <defs>
        <filter id={`shadow-servo-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#3a3a3a" floodOpacity="0.5"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="60" height="35" rx="3" fill="#3a3a3a" stroke="#555" strokeWidth="1.5" filter={`url(#shadow-servo-${id})`} />
      <rect x="5" y="18" width="8" height="18" rx="1" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
      <rect x="62" y="18" width="8" height="18" rx="1" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />

      <circle cx="40" cy="8" r="8" fill="#555" stroke="#666" strokeWidth="1" />
      <g style={{ transform: `rotate(${hornAngle}deg)`, transformOrigin: '40px 8px', transition: 'transform 150ms ease-out' }}>
        <rect x="37" y="-8" width="6" height="16" rx="2" fill="#ddd" stroke="#999" strokeWidth="0.5" />
      </g>
      <circle cx="40" cy="8" r="3" fill="#888" />

      <text x="40" y="32" textAnchor="middle" fontSize="7" fill="#aaa" fontFamily="IBM Plex Mono" fontWeight="bold">
        SG90
      </text>

      <line x1="20" y1="45" x2="20" y2="70" stroke="#ff3333" strokeWidth="2" />
      <line x1="40" y1="45" x2="40" y2="70" stroke="#553300" strokeWidth="2" />
      <line x1="60" y1="45" x2="60" y2="70" stroke="#ff8800" strokeWidth="2" />

      {SERVO_PINS.map((pin) => (
        <g key={pin.id}>
          <circle
            cx={pin.x} cy={pin.y} r="5"
            fill={pin.type === 'power' ? '#ff4444' : pin.type === 'gnd' ? '#554400' : '#ff8800'}
            stroke={pin.type === 'signal' ? '#ffaa00' : pin.type === 'power' ? '#ff6666' : '#886600'}
            strokeWidth="0.5"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onPinClick?.(id, pin.id, pin.x, pin.y); }}
          />
          <text
            x={pin.x} y={pin.y + 12}
            textAnchor="middle" fontSize="5" fill="#aaa"
            fontFamily="IBM Plex Mono"
          >
            {pin.label}
          </text>
        </g>
      ))}
    </g>
  );
});

export default ServoSG90;
