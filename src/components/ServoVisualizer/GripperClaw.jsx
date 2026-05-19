import { memo, useId } from 'react';

const GripperClaw = memo(function GripperClaw({ gripperAngle, rotationAngle }) {
  const uid = useId().replace(/:/g, '');
  const openAmount = gripperAngle / 180;
  const jawAngle = 30 * openAmount;
  const wristRot = rotationAngle - 90;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 260 340"
      style={{ display: 'block', maxHeight: '100%' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`arm-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3d3d3d" />
          <stop offset="30%" stopColor="#555" />
          <stop offset="70%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#333" />
        </linearGradient>
        <linearGradient id={`servo-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="50%" stopColor="#222" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <linearGradient id={`jaw-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a5a5a" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </linearGradient>
        <linearGradient id={`tip-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FFF0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00FFF0" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`base-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#444" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </linearGradient>
        <filter id={`glow-${uid}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`shadow-${uid}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g transform="translate(130, 0)">
        {/* === BASE MOUNT === */}
        <rect x="-50" y="0" width="100" height="14" rx="3" fill={`url(#base-${uid})`} stroke="#555" strokeWidth="0.8" />
        <rect x="-42" y="2" width="84" height="10" rx="2" fill="#333" stroke="#444" strokeWidth="0.3" />
        {/* Mounting holes */}
        <circle cx="-32" cy="7" r="3" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />
        <circle cx="32" cy="7" r="3" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />
        <circle cx="-32" cy="7" r="1.5" fill="#111" />
        <circle cx="32" cy="7" r="1.5" fill="#111" />

        {/* === ROTATION SERVO (top) === */}
        <rect x="-28" y="14" width="56" height="40" rx="4" fill={`url(#servo-${uid})`} stroke="#444" strokeWidth="1" />
        {/* Servo label */}
        <rect x="-22" y="18" width="44" height="10" rx="1.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.3" />
        <text x="0" y="25" textAnchor="middle" fontSize="6" fill="#FF8800" fontFamily="monospace" opacity="0.8">WRIST SRV</text>
        {/* Servo details */}
        <rect x="-22" y="30" width="20" height="6" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.3" />
        <text x="-12" y="35" textAnchor="middle" fontSize="4.5" fill="#888" fontFamily="monospace">SG90</text>
        {/* LED indicator */}
        <circle cx="16" cy="33" r="2" fill="#FF8800" opacity="0.6" filter={`url(#glow-${uid})`} />
        {/* Servo horn housing */}
        <rect x="-20" y="44" width="40" height="10" rx="2" fill="#333" stroke="#444" strokeWidth="0.5" />

        {/* === ROTATION JOINT === */}
        <circle cx="0" cy="60" r="14" fill="#2a2a2a" stroke="#444" strokeWidth="1" />
        <circle cx="0" cy="60" r="10" fill="#222" stroke="#555" strokeWidth="0.5" />
        {/* Rotation indicator ring */}
        <circle cx="0" cy="60" r="12" fill="none" stroke="#FF8800" strokeWidth="0.5" opacity="0.4" strokeDasharray="2 3" />

        {/* === ROTATING GROUP (wrist + gripper) === */}
        <g style={{
          transform: `rotate(${wristRot}deg)`,
          transformOrigin: '0px 60px',
          transition: 'transform 150ms ease-out',
        }}>
          {/* Rotation horn */}
          <rect x="-4" y="48" width="8" height="24" rx="2" fill="#ddd" stroke="#aaa" strokeWidth="0.5" />
          <circle cx="0" cy="60" r="5" fill="#555" stroke="#777" strokeWidth="0.5" />
          <circle cx="0" cy="60" r="2" fill="#333" />
          {/* Direction marker */}
          <circle cx="0" cy="52" r="1.5" fill="#FF8800" opacity="0.7" />

          {/* === WRIST ARM SEGMENT === */}
          <rect x="-16" y="70" width="32" height="50" rx="4" fill={`url(#arm-${uid})`} stroke="#555" strokeWidth="0.8" />
          {/* Arm channel details */}
          <line x1="-10" y1="78" x2="10" y2="78" stroke="#444" strokeWidth="0.5" />
          <line x1="-10" y1="86" x2="10" y2="86" stroke="#444" strokeWidth="0.5" />
          <line x1="-10" y1="94" x2="10" y2="94" stroke="#444" strokeWidth="0.5" />
          <line x1="-10" y1="102" x2="10" y2="102" stroke="#444" strokeWidth="0.5" />
          {/* Wire channels */}
          <rect x="-3" y="72" width="6" height="46" rx="1" fill="#2a2a2a" stroke="#333" strokeWidth="0.3" />
          {/* Wires running through */}
          <line x1="-1" y1="72" x2="-1" y2="118" stroke="#ff3333" strokeWidth="0.8" />
          <line x1="1" y1="72" x2="1" y2="118" stroke="#FF8800" strokeWidth="0.8" />

          {/* === GRIPPER SERVO === */}
          <rect x="-24" y="120" width="48" height="34" rx="4" fill={`url(#servo-${uid})`} stroke="#444" strokeWidth="1" />
          <rect x="-18" y="124" width="36" height="10" rx="1.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.3" />
          <text x="0" y="131" textAnchor="middle" fontSize="6" fill="#00FFF0" fontFamily="monospace" opacity="0.8">GRIP SRV</text>
          <rect x="-18" y="136" width="16" height="6" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="0.3" />
          <text x="-10" y="141" textAnchor="middle" fontSize="4.5" fill="#888" fontFamily="monospace">SG90</text>
          <circle cx="12" cy="139" r="2" fill="#00FFF0" opacity="0.6" filter={`url(#glow-${uid})`} />

          {/* === GRIPPER MECHANISM === */}
          <rect x="-20" y="154" width="40" height="8" rx="2" fill="#3a3a3a" stroke="#505050" strokeWidth="0.5" />

          {/* Gripper gear hub */}
          <circle cx="0" cy="162" r="8" fill="#222" stroke="#444" strokeWidth="0.8" />
          <g style={{
            transform: `rotate(${openAmount * 120}deg)`,
            transformOrigin: '0px 162px',
            transition: 'transform 150ms ease-out',
          }}>
            <rect x="-3" y="155" width="6" height="14" rx="1.5" fill="#ddd" stroke="#aaa" strokeWidth="0.3" />
          </g>
          <circle cx="0" cy="162" r="3.5" fill="#555" stroke="#777" strokeWidth="0.5" />
          <circle cx="0" cy="162" r="1.5" fill="#333" />

          {/* === LEFT FINGER === */}
          <g style={{
            transform: `rotate(${-jawAngle}deg)`,
            transformOrigin: '-6px 168px',
            transition: 'transform 150ms ease-out',
          }}>
            {/* Linkage */}
            <rect x="-14" y="164" width="12" height="8" rx="2" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
            <circle cx="-6" cy="168" r="3" fill="#555" stroke="#777" strokeWidth="0.5" />
            <circle cx="-6" cy="168" r="1.2" fill="#333" />

            {/* Proximal phalanx */}
            <rect x="-16" y="172" width="14" height="44" rx="3" fill={`url(#jaw-${uid})`} stroke="#555" strokeWidth="0.8" />
            {/* Knurling pattern */}
            <line x1="-13" y1="180" x2="-5" y2="180" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="-13" y1="185" x2="-5" y2="185" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="-13" y1="190" x2="-5" y2="190" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="-13" y1="195" x2="-5" y2="195" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="-13" y1="200" x2="-5" y2="200" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="-13" y1="205" x2="-5" y2="205" stroke="#4a4a4a" strokeWidth="0.5" />

            {/* Distal tip (fingertip) */}
            <path
              d="M -16 216 L -16 230 Q -16 240 -9 240 Q -2 240 -2 230 L -2 216 Z"
              fill={`url(#jaw-${uid})`}
              stroke="#555"
              strokeWidth="0.8"
            />
            {/* Grip pads */}
            <rect x="-14" y="218" width="10" height="18" rx="2" fill={`url(#tip-${uid})`} stroke="#00FFF0" strokeWidth="0.3" opacity="0.6" />
            <line x1="-12" y1="222" x2="-6" y2="222" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
            <line x1="-12" y1="226" x2="-6" y2="226" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
            <line x1="-12" y1="230" x2="-6" y2="230" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
          </g>

          {/* === RIGHT FINGER === */}
          <g style={{
            transform: `rotate(${jawAngle}deg)`,
            transformOrigin: '6px 168px',
            transition: 'transform 150ms ease-out',
          }}>
            {/* Linkage */}
            <rect x="2" y="164" width="12" height="8" rx="2" fill="#4a4a4a" stroke="#555" strokeWidth="0.5" />
            <circle cx="6" cy="168" r="3" fill="#555" stroke="#777" strokeWidth="0.5" />
            <circle cx="6" cy="168" r="1.2" fill="#333" />

            {/* Proximal phalanx */}
            <rect x="2" y="172" width="14" height="44" rx="3" fill={`url(#jaw-${uid})`} stroke="#555" strokeWidth="0.8" />
            {/* Knurling pattern */}
            <line x1="5" y1="180" x2="13" y2="180" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="5" y1="185" x2="13" y2="185" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="5" y1="190" x2="13" y2="190" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="5" y1="195" x2="13" y2="195" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="5" y1="200" x2="13" y2="200" stroke="#4a4a4a" strokeWidth="0.5" />
            <line x1="5" y1="205" x2="13" y2="205" stroke="#4a4a4a" strokeWidth="0.5" />

            {/* Distal tip (fingertip) */}
            <path
              d="M 2 216 L 2 230 Q 2 240 9 240 Q 16 240 16 230 L 16 216 Z"
              fill={`url(#jaw-${uid})`}
              stroke="#555"
              strokeWidth="0.8"
            />
            {/* Grip pads */}
            <rect x="4" y="218" width="10" height="18" rx="2" fill={`url(#tip-${uid})`} stroke="#00FFF0" strokeWidth="0.3" opacity="0.6" />
            <line x1="6" y1="222" x2="12" y2="222" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
            <line x1="6" y1="226" x2="12" y2="226" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
            <line x1="6" y1="230" x2="12" y2="230" stroke="#00FFF0" strokeWidth="0.4" opacity="0.4" />
          </g>
        </g>

        {/* === CABLE BUNDLE (static, behind rotation) === */}
        <path d="M -20 20 Q -40 30 -45 50 Q -50 70 -55 80" fill="none" stroke="#ff3333" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M -20 26 Q -42 36 -48 56 Q -54 76 -60 86" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M -20 32 Q -44 42 -52 62 Q -58 82 -65 92" fill="none" stroke="#FF8800" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
});

export default GripperClaw;
