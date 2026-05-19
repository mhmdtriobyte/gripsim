import { memo } from 'react';

export const POWER_SUPPLY_PINS = [
  { id: '+5V', x: 25, y: 55, type: 'power', label: '+5V' },
  { id: 'GND', x: 75, y: 55, type: 'gnd', label: 'GND' },
];

const PowerSupply = memo(function PowerSupply({ onPinClick, id }) {
  return (
    <g>
      <defs>
        <filter id={`shadow-power-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#2a2a2a" floodOpacity="0.5"/>
        </filter>
      </defs>
      <rect x="5" y="5" width="90" height="40" rx="4" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" filter={`url(#shadow-power-${id})`} />
      <rect x="8" y="8" width="84" height="34" rx="2" fill="#1a1a1a" />

      <text x="50" y="22" textAnchor="middle" fontSize="7" fill="#aaa" fontFamily="IBM Plex Mono" fontWeight="bold">
        5V DC
      </text>
      <text x="50" y="33" textAnchor="middle" fontSize="5" fill="#666" fontFamily="IBM Plex Mono">
        Power Supply
      </text>

      <line x1="25" y1="45" x2="25" y2="50" stroke="#ff3333" strokeWidth="2" />
      <line x1="75" y1="45" x2="75" y2="50" stroke="#333" strokeWidth="2" />

      {POWER_SUPPLY_PINS.map((pin) => (
        <g key={pin.id}>
          <circle
            cx={pin.x} cy={pin.y} r="5"
            fill={pin.type === 'power' ? '#ff4444' : '#444'}
            stroke={pin.type === 'power' ? '#ff6666' : '#666'}
            strokeWidth="0.5"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onPinClick?.(id, pin.id, pin.x, pin.y); }}
          />
          <text
            x={pin.x} y={pin.y + 12}
            textAnchor="middle" fontSize="5"
            fill={pin.type === 'power' ? '#ff8888' : '#888'}
            fontFamily="IBM Plex Mono"
          >
            {pin.label}
          </text>
        </g>
      ))}
    </g>
  );
});

export default PowerSupply;
