import { memo, useCallback } from 'react';
import { ARDUINO_PINS } from './components/ArduinoUno';
import { SERVO_PINS, ROBOTIC_ARM_PINS } from './components/ServoSG90';
import { POWER_SUPPLY_PINS } from './components/PowerSupply';
import { BREADBOARD_PINS } from './components/Breadboard';

const PIN_MAP = {
  arduino: ARDUINO_PINS,
  servo: SERVO_PINS,
  'robotic-arm': ROBOTIC_ARM_PINS,
  power: POWER_SUPPLY_PINS,
  breadboard: BREADBOARD_PINS,
};

function resolvePin(components, componentId, pinId) {
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return { x: 0, y: 0 };
  const pins = PIN_MAP[comp.type];
  if (!pins) return { x: comp.x, y: comp.y };
  const pin = pins.find((p) => p.id === pinId);
  if (!pin) return { x: comp.x, y: comp.y };
  return { x: comp.x + pin.x, y: comp.y + pin.y };
}

function getWireColor(sourcePinId, targetPinId) {
  const pins = [sourcePinId, targetPinId];
  if (pins.some((p) => p === 'VCC' || p === 'VCC1' || p === 'VCC2' || p === '5V' || p === '+5V' || p === '3.3V' || p.startsWith('PWR_T+') || p.startsWith('PWR_B+') || p === 'PWR+'))
    return '#ff3333';
  if (pins.some((p) => p === 'GND' || p === 'GND1' || p === 'GND2' || p.startsWith('PWR_T-') || p.startsWith('PWR_B-') || p === 'PWR-'))
    return '#333333';
  return '#ffcc00';
}

/**
 * Build an orthogonal (90-degree) wire path between two points.
 * The route goes: source -> down by offset -> horizontal -> up/down to target.
 * This avoids diagonal bezier curves and mimics Tinkercad-style wiring.
 */
function buildOrthogonalPath(sx, sy, tx, ty) {
  // Determine a vertical offset from source to create clearance
  const dy = ty - sy;
  const dx = tx - sx;

  // If points are very close vertically, just do an L-shape
  if (Math.abs(dy) < 8) {
    const midX = sx + dx / 2;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  }

  // Standard 3-segment route:
  // 1. Go vertically from source by a portion of the total vertical distance
  // 2. Go horizontally to align with target X
  // 3. Go vertically to target
  const verticalFirst = Math.abs(dy) > Math.abs(dx);

  if (verticalFirst) {
    // Go down partway, then across, then down to target
    const midY = sy + dy * 0.4;
    return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
  } else {
    // Go across partway, then down, then across to target
    const midX = sx + dx * 0.4;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  }
}

const WireLayer = memo(function WireLayer({ wires, components, selectedId, onSelect, failedWireIds = [] }) {
  const handleClick = useCallback(
    (e, wireId) => {
      e.stopPropagation();
      onSelect(wireId);
    },
    [onSelect]
  );

  return (
    <g>
      {wires.map((wire) => {
        const src = resolvePin(components, wire.sourceComponentId, wire.sourcePinId);
        const tgt = resolvePin(components, wire.targetComponentId, wire.targetPinId);
        const isFailed = failedWireIds.includes(wire.id);
        const color = isFailed ? 'var(--accent-red)' : getWireColor(wire.sourcePinId, wire.targetPinId);
        const isSelected = selectedId === wire.id;
        const path = buildOrthogonalPath(src.x, src.y, tgt.x, tgt.y);

        return (
          <g key={wire.id}>
            {/* Wide transparent hit area for click detection */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="14"
              strokeLinejoin="round"
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleClick(e, wire.id)}
            />
            {/* Visible wire */}
            <path
              d={path}
              fill="none"
              stroke={isSelected ? 'var(--accent-cyan)' : color}
              strokeWidth={isSelected ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isSelected ? 1 : 0.85}
              pointerEvents="none"
              className={isFailed ? 'pulse-glow' : ''}
            />
            {/* Selection overlay */}
            {isSelected && (
              <path
                d={path}
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeLinejoin="round"
                className="wire-animated"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </g>
  );
});

export default WireLayer;
