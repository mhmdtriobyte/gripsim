import { memo } from 'react';

// Legacy single-servo pins kept for backward compat
export const SERVO_PINS = [
  { id: 'VCC', x: 20, y: 75, type: 'power', label: 'VCC' },
  { id: 'GND', x: 40, y: 75, type: 'gnd', label: 'GND' },
  { id: 'Signal', x: 60, y: 75, type: 'signal', label: 'SIG' },
];

// Combined robotic arm pins: 6 total (2 servos x 3 pins each)
export const ROBOTIC_ARM_PINS = [
  { id: 'VCC1', x: 20,  y: 290, type: 'power',  label: 'VCC1' },
  { id: 'GND1', x: 40,  y: 290, type: 'gnd',    label: 'GND1' },
  { id: 'SIG1', x: 60,  y: 290, type: 'signal',  label: 'SIG1' },
  { id: 'VCC2', x: 90,  y: 290, type: 'power',  label: 'VCC2' },
  { id: 'GND2', x: 110, y: 290, type: 'gnd',    label: 'GND2' },
  { id: 'SIG2', x: 130, y: 290, type: 'signal',  label: 'SIG2' },
];

/**
 * Robotic Gripper Arm component.
 *
 * Two SG90 servos drive the arm:
 *   - Rotation servo (bottom): rotates the wrist, driven by `rotationAngle`
 *   - Gripper servo (top): opens/closes the jaws, driven by `gripperAngle`
 *
 * Props:
 *   id            - component instance id
 *   onPinClick    - callback(componentId, pinId, localX, localY)
 *   gripperAngle  - 0..180 gripper open/close angle (default 0 = closed)
 *   rotationAngle - 0..180 wrist rotation angle (default 90 = center)
 */
const RoboticArm = memo(function RoboticArm({
  onPinClick,
  id,
  gripperAngle = 0,
  rotationAngle = 90,
}) {
  const wristRotation = (rotationAngle - 90);
  const jawOpenDeg = (gripperAngle / 180) * 30;

  return (
    <g>
      <defs>
        <filter id={`shadow-arm-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#1a1a1a" floodOpacity="0.6" />
        </filter>
        <linearGradient id={`metal-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#606060" />
          <stop offset="50%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#383838" />
        </linearGradient>
        <linearGradient id={`servo-body-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#454545" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </linearGradient>
      </defs>

      {/* ===== BASE / MOUNT ===== */}
      <rect
        x="15" y="230" width="120" height="30" rx="4"
        fill="#2a2a2a" stroke="#444" strokeWidth="1.5"
        filter={`url(#shadow-arm-${id})`}
      />
      {/* Base plate detail */}
      <rect x="25" y="234" width="100" height="22" rx="2" fill="#222" stroke="#333" strokeWidth="0.5" />
      {/* Mounting bolts */}
      <circle cx="30" cy="245" r="3" fill="#555" stroke="#666" strokeWidth="0.5" />
      <circle cx="30" cy="245" r="1.2" fill="#333" />
      <circle cx="120" cy="245" r="3" fill="#555" stroke="#666" strokeWidth="0.5" />
      <circle cx="120" cy="245" r="1.2" fill="#333" />
      <text x="75" y="249" textAnchor="middle" fontSize="6" fill="#666" fontFamily="IBM Plex Mono" fontWeight="bold">
        BASE
      </text>

      {/* ===== ROTATION SERVO (bottom servo) ===== */}
      <g
        style={{
          transform: `rotate(${wristRotation}deg)`,
          transformOrigin: '75px 210px',
          transition: 'transform 200ms ease-out',
        }}
      >
        {/* Vertical arm column from base up to rotation servo */}
        <rect x="60" y="140" width="30" height="90" rx="2" fill={`url(#metal-${id})`} stroke="#555" strokeWidth="1" />

        {/* Rotation servo body */}
        <rect x="40" y="170" width="70" height="38" rx="3" fill={`url(#servo-body-${id})`} stroke="#555" strokeWidth="1.5" />
        {/* Servo mounting tabs */}
        <rect x="33" y="178" width="10" height="20" rx="1" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
        <rect x="107" y="178" width="10" height="20" rx="1" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
        {/* Servo label */}
        <text x="75" y="193" textAnchor="middle" fontSize="6" fill="#aaa" fontFamily="IBM Plex Mono" fontWeight="bold">
          SG90
        </text>
        <text x="75" y="201" textAnchor="middle" fontSize="4.5" fill="#888" fontFamily="IBM Plex Mono">
          ROTATION
        </text>
        {/* Servo shaft circle */}
        <circle cx="75" cy="168" r="7" fill="#555" stroke="#666" strokeWidth="1" />
        <circle cx="75" cy="168" r="3" fill="#888" />

        {/* ===== UPPER ARM connecting to gripper servo ===== */}
        <rect x="62" y="90" width="26" height="80" rx="2" fill={`url(#metal-${id})`} stroke="#555" strokeWidth="1" />
        {/* Decorative bolts on upper arm */}
        <circle cx="75" cy="110" r="2" fill="#666" stroke="#777" strokeWidth="0.3" />
        <circle cx="75" cy="130" r="2" fill="#666" stroke="#777" strokeWidth="0.3" />

        {/* ===== GRIPPER SERVO (top servo) ===== */}
        <rect x="42" y="58" width="66" height="35" rx="3" fill={`url(#servo-body-${id})`} stroke="#555" strokeWidth="1.5" />
        {/* Servo mounting tabs */}
        <rect x="35" y="65" width="10" height="18" rx="1" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
        <rect x="105" y="65" width="10" height="18" rx="1" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
        <text x="75" y="78" textAnchor="middle" fontSize="6" fill="#aaa" fontFamily="IBM Plex Mono" fontWeight="bold">
          SG90
        </text>
        <text x="75" y="86" textAnchor="middle" fontSize="4.5" fill="#888" fontFamily="IBM Plex Mono">
          GRIPPER
        </text>
        {/* Gripper shaft */}
        <circle cx="75" cy="56" r="6" fill="#555" stroke="#666" strokeWidth="1" />
        <circle cx="75" cy="56" r="2.5" fill="#888" />

        {/* ===== GRIPPER JAWS ===== */}
        {/* Left jaw */}
        <g
          style={{
            transform: `rotate(${-jawOpenDeg}deg)`,
            transformOrigin: '75px 56px',
            transition: 'transform 200ms ease-out',
          }}
        >
          {/* Finger arm */}
          <rect x="56" y="10" width="14" height="46" rx="3" fill={`url(#metal-${id})`} stroke="#666" strokeWidth="1" />
          {/* Knurling lines */}
          <line x1="59" y1="20" x2="67" y2="20" stroke="#555" strokeWidth="0.5" />
          <line x1="59" y1="26" x2="67" y2="26" stroke="#555" strokeWidth="0.5" />
          <line x1="59" y1="32" x2="67" y2="32" stroke="#555" strokeWidth="0.5" />
          {/* Pivot bolt */}
          <circle cx="63" cy="52" r="3" fill="#666" stroke="#777" strokeWidth="0.5" />
          <circle cx="63" cy="52" r="1.2" fill="#444" />
          {/* Fingertip with grip pad */}
          <rect x="54" y="2" width="18" height="12" rx="3" fill="#555" stroke="#666" strokeWidth="1" />
          <rect x="56" y="3" width="6" height="10" rx="1.5" fill="#00FFF0" opacity="0.2" stroke="#00FFF0" strokeWidth="0.3" />
          <line x1="57" y1="5" x2="61" y2="5" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
          <line x1="57" y1="8" x2="61" y2="8" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
          <line x1="57" y1="11" x2="61" y2="11" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
        </g>

        {/* Right jaw */}
        <g
          style={{
            transform: `rotate(${jawOpenDeg}deg)`,
            transformOrigin: '75px 56px',
            transition: 'transform 200ms ease-out',
          }}
        >
          {/* Finger arm */}
          <rect x="80" y="10" width="14" height="46" rx="3" fill={`url(#metal-${id})`} stroke="#666" strokeWidth="1" />
          {/* Knurling lines */}
          <line x1="83" y1="20" x2="91" y2="20" stroke="#555" strokeWidth="0.5" />
          <line x1="83" y1="26" x2="91" y2="26" stroke="#555" strokeWidth="0.5" />
          <line x1="83" y1="32" x2="91" y2="32" stroke="#555" strokeWidth="0.5" />
          {/* Pivot bolt */}
          <circle cx="87" cy="52" r="3" fill="#666" stroke="#777" strokeWidth="0.5" />
          <circle cx="87" cy="52" r="1.2" fill="#444" />
          {/* Fingertip with grip pad */}
          <rect x="78" y="2" width="18" height="12" rx="3" fill="#555" stroke="#666" strokeWidth="1" />
          <rect x="88" y="3" width="6" height="10" rx="1.5" fill="#00FFF0" opacity="0.2" stroke="#00FFF0" strokeWidth="0.3" />
          <line x1="89" y1="5" x2="93" y2="5" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
          <line x1="89" y1="8" x2="93" y2="8" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
          <line x1="89" y1="11" x2="93" y2="11" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
        </g>
      </g>

      {/* ===== WIRING HARNESS ===== */}
      {/* Rotation servo wires (left group) */}
      <line x1="20" y1="260" x2="20" y2="283" stroke="#ff3333" strokeWidth="1.8" />
      <line x1="40" y1="260" x2="40" y2="283" stroke="#553300" strokeWidth="1.8" />
      <line x1="60" y1="260" x2="60" y2="283" stroke="#ff8800" strokeWidth="1.8" />
      {/* Gripper servo wires (right group) */}
      <line x1="90" y1="260" x2="90" y2="283" stroke="#ff3333" strokeWidth="1.8" />
      <line x1="110" y1="260" x2="110" y2="283" stroke="#553300" strokeWidth="1.8" />
      <line x1="130" y1="260" x2="130" y2="283" stroke="#ff8800" strokeWidth="1.8" />

      {/* Wire group labels */}
      <text x="40" y="272" textAnchor="middle" fontSize="4" fill="#888" fontFamily="IBM Plex Mono">
        ROT
      </text>
      <text x="110" y="272" textAnchor="middle" fontSize="4" fill="#888" fontFamily="IBM Plex Mono">
        GRIP
      </text>

      {/* ===== PIN CONNECTORS ===== */}
      {ROBOTIC_ARM_PINS.map((pin) => {
        const pinFill =
          pin.type === 'power' ? '#ff4444' :
          pin.type === 'gnd' ? '#554400' :
          '#ff8800';
        const pinStroke =
          pin.type === 'power' ? '#ff6666' :
          pin.type === 'gnd' ? '#886600' :
          '#ffaa00';
        return (
          <g key={pin.id}>
            <circle
              cx={pin.x} cy={pin.y} r="5"
              fill={pinFill}
              stroke={pinStroke}
              strokeWidth="0.5"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick?.(id, pin.id, pin.x, pin.y);
              }}
            />
            <text
              x={pin.x} y={pin.y + 12}
              textAnchor="middle" fontSize="4.5" fill="#aaa"
              fontFamily="IBM Plex Mono"
            >
              {pin.label}
            </text>
          </g>
        );
      })}

      {/* Component title */}
      <text x="75" y="316" textAnchor="middle" fontSize="5" fill="#666" fontFamily="IBM Plex Mono">
        ROBOTIC ARM
      </text>
    </g>
  );
});

// Default export is now the robotic arm
export default RoboticArm;
