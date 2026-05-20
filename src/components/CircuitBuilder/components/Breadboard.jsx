import { memo } from 'react';

const COLS = 15;
const COL_SPACING = 14;
const ROW_SPACING = 10;
const LEFT_MARGIN = 30;
const TOP_RAIL_Y = 14;
const BOTTOM_RAIL_Y = 126;
const TOP_STRIP_Y = 34;
const BOTTOM_STRIP_Y = 78;
const BOARD_W = LEFT_MARGIN + COLS * COL_SPACING + 16;
const BOARD_H = 140;

const topRows = ['a', 'b', 'c', 'd', 'e'];
const botRows = ['f', 'g', 'h', 'i', 'j'];

function buildPins() {
  const pins = [];

  for (let col = 0; col < COLS; col++) {
    const cx = LEFT_MARGIN + col * COL_SPACING;
    pins.push({ id: `TR+_${col + 1}`, x: cx, y: TOP_RAIL_Y, type: 'power', label: '+' });
    pins.push({ id: `TR-_${col + 1}`, x: cx, y: TOP_RAIL_Y + ROW_SPACING, type: 'gnd', label: '-' });
    pins.push({ id: `BR+_${col + 1}`, x: cx, y: BOTTOM_RAIL_Y, type: 'power', label: '+' });
    pins.push({ id: `BR-_${col + 1}`, x: cx, y: BOTTOM_RAIL_Y + ROW_SPACING, type: 'gnd', label: '-' });
  }

  for (let col = 0; col < COLS; col++) {
    const cx = LEFT_MARGIN + col * COL_SPACING;
    for (let ri = 0; ri < topRows.length; ri++) {
      pins.push({ id: `T${col + 1}_${topRows[ri]}`, x: cx, y: TOP_STRIP_Y + ri * ROW_SPACING, type: 'terminal' });
    }
    for (let ri = 0; ri < botRows.length; ri++) {
      pins.push({ id: `B${col + 1}_${botRows[ri]}`, x: cx, y: BOTTOM_STRIP_Y + ri * ROW_SPACING, type: 'terminal' });
    }
  }

  // Legacy aliases so old reference wires still resolve
  const legacy = [
    { id: 'PWR_T+', x: LEFT_MARGIN + 2 * COL_SPACING, y: TOP_RAIL_Y, type: 'power', label: '+' },
    { id: 'PWR_T-', x: LEFT_MARGIN + 2 * COL_SPACING, y: TOP_RAIL_Y + ROW_SPACING, type: 'gnd', label: '-' },
    { id: 'PWR_B+', x: LEFT_MARGIN + 2 * COL_SPACING, y: BOTTOM_RAIL_Y, type: 'power', label: '+' },
    { id: 'PWR_B-', x: LEFT_MARGIN + 2 * COL_SPACING, y: BOTTOM_RAIL_Y + ROW_SPACING, type: 'gnd', label: '-' },
    { id: 'PWR_T+_R', x: LEFT_MARGIN + 10 * COL_SPACING, y: TOP_RAIL_Y, type: 'power', label: '+' },
    { id: 'PWR_T-_R', x: LEFT_MARGIN + 10 * COL_SPACING, y: TOP_RAIL_Y + ROW_SPACING, type: 'gnd', label: '-' },
    { id: 'PWR_B+_R', x: LEFT_MARGIN + 10 * COL_SPACING, y: BOTTOM_RAIL_Y, type: 'power', label: '+' },
    { id: 'PWR_B-_R', x: LEFT_MARGIN + 10 * COL_SPACING, y: BOTTOM_RAIL_Y + ROW_SPACING, type: 'gnd', label: '-' },
  ];
  for (const lp of legacy) {
    if (!pins.find(p => p.id === lp.id)) pins.push(lp);
  }

  return pins;
}

export const BREADBOARD_PINS = buildPins();

const Breadboard = memo(function Breadboard({ onPinClick, id }) {
  const handlePinClick = (e, pin) => {
    e.stopPropagation();
    onPinClick?.(id, pin.id, pin.x, pin.y);
  };

  return (
    <g>
      <defs>
        <filter id={`shadow-bb-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#888" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Main board */}
      <rect
        x="0" y="0" width={BOARD_W} height={BOARD_H} rx="4"
        fill="#e8e8d8" stroke="#ccc" strokeWidth="1.2"
        filter={`url(#shadow-bb-${id})`}
      />
      <rect x="3" y="3" width={BOARD_W - 6} height={BOARD_H - 6} rx="2" fill="#f0f0e4" />

      {/* ===== TOP POWER RAIL ===== */}
      <line x1="10" y1={TOP_RAIL_Y} x2={BOARD_W - 10} y2={TOP_RAIL_Y} stroke="#ff3333" strokeWidth="0.8" opacity="0.5" />
      <line x1="10" y1={TOP_RAIL_Y + ROW_SPACING} x2={BOARD_W - 10} y2={TOP_RAIL_Y + ROW_SPACING} stroke="#3333ff" strokeWidth="0.8" opacity="0.5" />
      <text x="8" y={TOP_RAIL_Y + 3} fontSize="6" fill="#ff3333" fontFamily="IBM Plex Mono" fontWeight="bold">+</text>
      <text x="8" y={TOP_RAIL_Y + ROW_SPACING + 3} fontSize="6" fill="#3333ff" fontFamily="IBM Plex Mono" fontWeight="bold">-</text>

      {/* Column numbers */}
      {Array.from({ length: COLS }).map((_, col) => (
        <text
          key={`cn-${col}`}
          x={LEFT_MARGIN + col * COL_SPACING}
          y={TOP_STRIP_Y - 3}
          textAnchor="middle" fontSize="4" fill="#999" fontFamily="IBM Plex Mono"
        >
          {col + 1}
        </text>
      ))}

      {/* Top strip row labels */}
      {topRows.map((row, ri) => (
        <text
          key={`tl-${row}`}
          x="14"
          y={TOP_STRIP_Y + ri * ROW_SPACING + 3}
          textAnchor="middle" fontSize="4" fill="#999" fontFamily="IBM Plex Mono"
        >
          {row}
        </text>
      ))}

      {/* ===== CENTER CHANNEL ===== */}
      <rect
        x="10" y={TOP_STRIP_Y + 5 * ROW_SPACING - 2}
        width={BOARD_W - 20} height="8" rx="1"
        fill="#d8d8c8" stroke="#c0c0b0" strokeWidth="0.5"
      />

      {/* Bottom strip row labels */}
      {botRows.map((row, ri) => (
        <text
          key={`bl-${row}`}
          x="14"
          y={BOTTOM_STRIP_Y + ri * ROW_SPACING + 3}
          textAnchor="middle" fontSize="4" fill="#999" fontFamily="IBM Plex Mono"
        >
          {row}
        </text>
      ))}

      {/* ===== BOTTOM POWER RAIL ===== */}
      <line x1="10" y1={BOTTOM_RAIL_Y} x2={BOARD_W - 10} y2={BOTTOM_RAIL_Y} stroke="#ff3333" strokeWidth="0.8" opacity="0.5" />
      <line x1="10" y1={BOTTOM_RAIL_Y + ROW_SPACING} x2={BOARD_W - 10} y2={BOTTOM_RAIL_Y + ROW_SPACING} stroke="#3333ff" strokeWidth="0.8" opacity="0.5" />
      <text x="8" y={BOTTOM_RAIL_Y + 3} fontSize="6" fill="#ff3333" fontFamily="IBM Plex Mono" fontWeight="bold">+</text>
      <text x="8" y={BOTTOM_RAIL_Y + ROW_SPACING + 3} fontSize="6" fill="#3333ff" fontFamily="IBM Plex Mono" fontWeight="bold">-</text>

      {/* ===== ALL CLICKABLE HOLES ===== */}
      {BREADBOARD_PINS.map((pin) => {
        // Skip legacy aliases that overlap with grid pins
        if (pin.id.startsWith('PWR_')) return null;
        const isPower = pin.type === 'power';
        const isGnd = pin.type === 'gnd';
        const isRail = isPower || isGnd;
        const fill = isRail ? (isPower ? '#e0c0c0' : '#c0c0e0') : '#ccc';
        const hoverFill = isRail ? (isPower ? '#ff6666' : '#6666ff') : '#aaa';
        return (
          <circle
            key={pin.id}
            cx={pin.x} cy={pin.y} r={isRail ? 2.8 : 2.5}
            fill={fill}
            stroke={isRail ? (isPower ? '#cc8888' : '#8888cc') : '#aaa'}
            strokeWidth="0.4"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => { e.target.setAttribute('fill', hoverFill); e.target.setAttribute('r', isRail ? '3.5' : '3.2'); }}
            onMouseLeave={(e) => { e.target.setAttribute('fill', fill); e.target.setAttribute('r', isRail ? '2.8' : '2.5'); }}
            onClick={(e) => handlePinClick(e, pin)}
          />
        );
      })}
    </g>
  );
});

export default Breadboard;
