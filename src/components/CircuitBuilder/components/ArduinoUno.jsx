import { memo } from 'react';

const DIGITAL_PINS = [
  { id: 'D0', x: 222, y: 8, pwm: false },
  { id: 'D1', x: 208, y: 8, pwm: false },
  { id: 'D2', x: 194, y: 8, pwm: false },
  { id: 'D3', x: 180, y: 8, pwm: true },
  { id: 'D4', x: 166, y: 8, pwm: false },
  { id: 'D5', x: 152, y: 8, pwm: true },
  { id: 'D6', x: 138, y: 8, pwm: true },
  { id: 'D7', x: 124, y: 8, pwm: false },
  { id: 'D8', x: 104, y: 8, pwm: false },
  { id: 'D9', x: 90, y: 8, pwm: true },
  { id: 'D10', x: 76, y: 8, pwm: true },
  { id: 'D11', x: 62, y: 8, pwm: true },
  { id: 'D12', x: 48, y: 8, pwm: false },
  { id: 'D13', x: 34, y: 8, pwm: false },
];

const POWER_PINS = [
  { id: 'VIN', x: 106, y: 132, type: 'power' },
  { id: 'GND2', x: 120, y: 132, type: 'gnd', label: 'GND' },
  { id: 'GND1', x: 134, y: 132, type: 'gnd', label: 'GND' },
  { id: '5V', x: 148, y: 132, type: 'power' },
  { id: '3.3V', x: 162, y: 132, type: 'power' },
  { id: 'RESET', x: 176, y: 132, type: 'other' },
];

const ANALOG_PINS = [
  { id: 'A0', x: 34, y: 132 },
  { id: 'A1', x: 48, y: 132 },
  { id: 'A2', x: 62, y: 132 },
  { id: 'A3', x: 76, y: 132 },
  { id: 'A4', x: 190, y: 132 },
  { id: 'A5', x: 204, y: 132 },
];

export const ARDUINO_PINS = [...DIGITAL_PINS.map(p => ({
  ...p,
  type: 'digital',
  label: p.id,
})), ...POWER_PINS.map(p => ({
  ...p,
  label: p.label || p.id,
})), ...ANALOG_PINS.map(p => ({
  ...p,
  type: 'analog',
  label: p.id,
}))];

const ArduinoUno = memo(function ArduinoUno({ onPinClick, id, connectedPins }) {
  const connected = connectedPins || new Set();

  return (
    <g>
      <defs>
        <filter id={`shadow-arduino-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#003060" floodOpacity="0.6"/>
        </filter>
        <filter id={`pin-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`pcb-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#007C8A"/>
          <stop offset="50%" stopColor="#006B78"/>
          <stop offset="100%" stopColor="#005A66"/>
        </linearGradient>
        <pattern id={`pcb-texture-${id}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="none"/>
          <circle cx="2" cy="2" r="0.3" fill="rgba(255,255,255,0.03)"/>
        </pattern>
      </defs>

      {/* PCB Board */}
      <rect
        x="0" y="0" width="240" height="140" rx="4"
        fill={`url(#pcb-grad-${id})`}
        stroke="#004D57" strokeWidth="1.5"
        filter={`url(#shadow-arduino-${id})`}
      />
      <rect
        x="0" y="0" width="240" height="140" rx="4"
        fill={`url(#pcb-texture-${id})`}
      />

      {/* Mounting holes */}
      <circle cx="10" cy="10" r="4" fill="none" stroke="#004D57" strokeWidth="1"/>
      <circle cx="10" cy="10" r="1.8" fill="#222"/>
      <circle cx="230" cy="10" r="4" fill="none" stroke="#004D57" strokeWidth="1"/>
      <circle cx="230" cy="10" r="1.8" fill="#222"/>
      <circle cx="10" cy="130" r="4" fill="none" stroke="#004D57" strokeWidth="1"/>
      <circle cx="10" cy="130" r="1.8" fill="#222"/>
      <circle cx="230" cy="130" r="4" fill="none" stroke="#004D57" strokeWidth="1"/>
      <circle cx="230" cy="130" r="1.8" fill="#222"/>

      {/* USB-B port */}
      <rect x="-4" y="48" width="28" height="22" rx="2" fill="#A8A8A8" stroke="#787878" strokeWidth="1"/>
      <rect x="-2" y="51" width="22" height="16" rx="1" fill="#606060" stroke="#505050" strokeWidth="0.5"/>
      <rect x="2" y="54" width="14" height="10" rx="0.5" fill="#404040"/>

      {/* Barrel jack */}
      <rect x="-2" y="95" width="24" height="18" rx="2" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
      <circle cx="10" cy="104" r="4.5" fill="#111" stroke="#333" strokeWidth="0.5"/>
      <circle cx="10" cy="104" r="2" fill="#444"/>

      {/* ATmega328P chip */}
      <rect x="85" y="42" width="70" height="56" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.5"/>
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={`chip-l-${i}`} x="82" y={45 + i * 3.7} width="5" height="1.5" rx="0.3" fill="#999"/>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={`chip-r-${i}`} x="153" y={45 + i * 3.7} width="5" height="1.5" rx="0.3" fill="#999"/>
      ))}
      <circle cx="91" cy="47" r="1.5" fill="#333" stroke="#444" strokeWidth="0.3"/>
      <text x="120" y="68" textAnchor="middle" fontSize="5.5" fill="#888" fontFamily="IBM Plex Mono" fontWeight="bold">
        ATMEGA
      </text>
      <text x="120" y="76" textAnchor="middle" fontSize="5" fill="#777" fontFamily="IBM Plex Mono">
        328P-PU
      </text>

      {/* Crystal oscillator */}
      <rect x="70" y="52" width="8" height="14" rx="3" fill="#C0C0C0" stroke="#999" strokeWidth="0.5"/>
      <text x="74" y="62" textAnchor="middle" fontSize="3" fill="#666" fontFamily="IBM Plex Mono">16</text>

      {/* Voltage regulator */}
      <rect x="30" y="96" width="14" height="10" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.5"/>
      <rect x="30" y="93" width="14" height="3" rx="0.5" fill="#888"/>

      {/* Reset button */}
      <rect x="56" y="36" width="10" height="8" rx="1" fill="#444" stroke="#555" strokeWidth="0.5"/>
      <circle cx="61" cy="40" r="2.5" fill="#C4A265" stroke="#A88840" strokeWidth="0.5"/>
      <text x="61" y="50" textAnchor="middle" fontSize="3.5" fill="#88B8B0" fontFamily="IBM Plex Mono">RST</text>

      {/* LEDs */}
      <circle cx="37" cy="38" r="2" fill="#33ff55" opacity="0.9"/>
      <circle cx="37" cy="38" r="3.5" fill="none" stroke="#33ff55" strokeWidth="0.3" opacity="0.4"/>
      <text x="37" y="35" textAnchor="middle" fontSize="3" fill="#88B8B0" fontFamily="IBM Plex Mono">ON</text>

      <circle cx="27" cy="38" r="1.5" fill="#ff3333" opacity="0.6"/>
      <text x="27" y="35" textAnchor="middle" fontSize="3" fill="#88B8B0" fontFamily="IBM Plex Mono">L</text>

      <circle cx="20" cy="38" r="1.5" fill="#ffaa00" opacity="0.5"/>
      <text x="20" y="35" textAnchor="middle" fontSize="3" fill="#88B8B0" fontFamily="IBM Plex Mono">TX</text>

      <circle cx="20" cy="45" r="1.5" fill="#ffaa00" opacity="0.5"/>
      <text x="20" y="51" textAnchor="middle" fontSize="3" fill="#88B8B0" fontFamily="IBM Plex Mono">RX</text>

      {/* Capacitors */}
      <circle cx="165" cy="50" r="5" fill="#333" stroke="#555" strokeWidth="0.5"/>
      <text x="165" y="52" textAnchor="middle" fontSize="3" fill="#888" fontFamily="IBM Plex Mono">C1</text>
      <circle cx="165" cy="104" r="5" fill="#333" stroke="#555" strokeWidth="0.5"/>
      <text x="165" y="106" textAnchor="middle" fontSize="3" fill="#888" fontFamily="IBM Plex Mono">C2</text>

      {/* PCB traces (decorative) */}
      <line x1="158" y1="70" x2="200" y2="70" stroke="#005F6A" strokeWidth="0.8" opacity="0.5"/>
      <line x1="158" y1="65" x2="210" y2="65" stroke="#005F6A" strokeWidth="0.6" opacity="0.4"/>
      <line x1="158" y1="75" x2="195" y2="75" stroke="#005F6A" strokeWidth="0.6" opacity="0.4"/>
      <line x1="82" y1="70" x2="50" y2="70" stroke="#005F6A" strokeWidth="0.8" opacity="0.5"/>
      <line x1="82" y1="80" x2="40" y2="80" stroke="#005F6A" strokeWidth="0.6" opacity="0.4"/>
      <line x1="120" y1="98" x2="120" y2="120" stroke="#005F6A" strokeWidth="0.6" opacity="0.4"/>
      <line x1="130" y1="42" x2="130" y2="25" stroke="#005F6A" strokeWidth="0.6" opacity="0.4"/>

      {/* ICSP header */}
      {[0, 1, 2].flatMap((col) => [0, 1].map((row) => (
        <circle key={`icsp-${col}-${row}`} cx={198 + col * 6} cy={100 + row * 6} r="1.5" fill="#C8A84E" stroke="#A88830" strokeWidth="0.3"/>
      )))}
      <text x="204" y="96" textAnchor="middle" fontSize="3" fill="#88B8B0" fontFamily="IBM Plex Mono">ICSP</text>

      {/* Silkscreen branding */}
      <text x="120" y="125" textAnchor="middle" fontSize="7" fill="#88C8BE" fontFamily="Orbitron, sans-serif" fontWeight="bold" letterSpacing="2">
        ARDUINO UNO
      </text>
      <text x="120" y="118" textAnchor="middle" fontSize="4" fill="#6AA89E" fontFamily="IBM Plex Mono">
        R3
      </text>

      {/* Pin header backgrounds */}
      <rect x="28" y="2" width="202" height="12" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="28" y="126" width="184" height="12" rx="1" fill="rgba(0,0,0,0.3)"/>

      {/* Digital header label */}
      <text x="118" y="28" textAnchor="middle" fontSize="3.5" fill="#88B8B0" fontFamily="IBM Plex Mono">DIGITAL (PWM~)</text>

      {/* Analog header label */}
      <text x="70" y="123" textAnchor="middle" fontSize="3.5" fill="#88B8B0" fontFamily="IBM Plex Mono">ANALOG IN</text>
      <text x="150" y="123" textAnchor="middle" fontSize="3.5" fill="#88B8B0" fontFamily="IBM Plex Mono">POWER</text>

      {/* Digital pins */}
      {DIGITAL_PINS.map((pin) => {
        const isConnected = connected.has(pin.id);
        return (
          <g key={pin.id}>
            {isConnected && (
              <circle
                cx={pin.x} cy={pin.y} r="9"
                fill="#00FFF0" opacity="0.15"
                filter={`url(#pin-glow-${id})`}
              />
            )}
            <circle
              cx={pin.x} cy={pin.y} r="5"
              fill={isConnected ? '#00FFF0' : pin.pwm ? '#C8A84E' : '#A88830'}
              stroke={isConnected ? '#00FFF0' : '#E8C860'}
              strokeWidth={isConnected ? 1.5 : 0.5}
              style={{ cursor: 'pointer' }}
              filter={isConnected ? `url(#pin-glow-${id})` : undefined}
              onClick={(e) => { e.stopPropagation(); onPinClick?.(id, pin.id, pin.x, pin.y); }}
            />
            <circle cx={pin.x} cy={pin.y} r="2" fill={isConnected ? '#005555' : '#222'}/>
            <text
              x={pin.x} y={pin.y + 16}
              textAnchor="middle" fontSize="4.5"
              fill={isConnected ? '#00FFF0' : '#88B8B0'}
              fontFamily="IBM Plex Mono"
              fontWeight={isConnected ? 'bold' : 'normal'}
            >
              {pin.pwm ? `~${pin.id.replace('D', '')}` : pin.id.replace('D', '')}
            </text>
          </g>
        );
      })}

      {/* Power pins */}
      {POWER_PINS.map((pin) => {
        const isConnected = connected.has(pin.id);
        const glowColor = pin.type === 'gnd' ? '#ff8800' : '#ff4444';
        return (
          <g key={pin.id}>
            {isConnected && (
              <circle
                cx={pin.x} cy={pin.y} r="9"
                fill={glowColor} opacity="0.15"
                filter={`url(#pin-glow-${id})`}
              />
            )}
            <circle
              cx={pin.x} cy={pin.y} r="5"
              fill={isConnected ? glowColor : pin.type === 'gnd' ? '#444' : pin.type === 'power' ? '#cc3333' : '#C8A84E'}
              stroke={isConnected ? glowColor : pin.type === 'gnd' ? '#666' : pin.type === 'power' ? '#ff5555' : '#E8C860'}
              strokeWidth={isConnected ? 1.5 : 0.5}
              style={{ cursor: 'pointer' }}
              filter={isConnected ? `url(#pin-glow-${id})` : undefined}
              onClick={(e) => { e.stopPropagation(); onPinClick?.(id, pin.id, pin.x, pin.y); }}
            />
            <circle cx={pin.x} cy={pin.y} r="2" fill={isConnected ? '#331100' : '#222'}/>
            <text
              x={pin.x} y={pin.y - 10}
              textAnchor="middle" fontSize="4"
              fill={isConnected ? glowColor : pin.type === 'gnd' ? '#999' : '#D09090'}
              fontFamily="IBM Plex Mono"
              fontWeight={isConnected ? 'bold' : 'normal'}
            >
              {pin.label || pin.id}
            </text>
          </g>
        );
      })}

      {/* Analog pins */}
      {ANALOG_PINS.map((pin) => {
        const isConnected = connected.has(pin.id);
        return (
          <g key={pin.id}>
            {isConnected && (
              <circle
                cx={pin.x} cy={pin.y} r="9"
                fill="#4488ff" opacity="0.15"
                filter={`url(#pin-glow-${id})`}
              />
            )}
            <circle
              cx={pin.x} cy={pin.y} r="5"
              fill={isConnected ? '#4488ff' : '#3366cc'}
              stroke={isConnected ? '#66aaff' : '#5588ee'}
              strokeWidth={isConnected ? 1.5 : 0.5}
              style={{ cursor: 'pointer' }}
              filter={isConnected ? `url(#pin-glow-${id})` : undefined}
              onClick={(e) => { e.stopPropagation(); onPinClick?.(id, pin.id, pin.x, pin.y); }}
            />
            <circle cx={pin.x} cy={pin.y} r="2" fill={isConnected ? '#112244' : '#222'}/>
            <text
              x={pin.x} y={pin.y - 10}
              textAnchor="middle" fontSize="4"
              fill={isConnected ? '#66aaff' : '#88aaff'}
              fontFamily="IBM Plex Mono"
              fontWeight={isConnected ? 'bold' : 'normal'}
            >
              {pin.id}
            </text>
          </g>
        );
      })}
    </g>
  );
});

export default ArduinoUno;
