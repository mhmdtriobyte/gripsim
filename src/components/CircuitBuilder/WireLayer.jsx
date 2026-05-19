import { memo, useCallback } from 'react';
import { ARDUINO_PINS } from './components/ArduinoUno';
import { SERVO_PINS } from './components/ServoSG90';
import { POWER_SUPPLY_PINS } from './components/PowerSupply';
import { BREADBOARD_PINS } from './components/Breadboard';

const PIN_MAP = {
  arduino: ARDUINO_PINS,
  servo: SERVO_PINS,
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
  if (pins.some((p) => p === 'VCC' || p === '5V' || p === '+5V' || p === '3.3V' || p === 'PWR+'))
    return '#ff3333';
  if (pins.some((p) => p === 'GND' || p === 'GND1' || p === 'GND2' || p === 'PWR-'))
    return '#333333';
  return '#ffcc00';
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
        const dx = tgt.x - src.x;
        const cx1 = src.x + dx * 0.4;
        const cy1 = src.y;
        const cx2 = tgt.x - dx * 0.4;
        const cy2 = tgt.y;
        const path = `M ${src.x} ${src.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tgt.x} ${tgt.y}`;

        return (
          <g key={wire.id}>
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="12"
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleClick(e, wire.id)}
            />
            <path
              d={path}
              fill="none"
              stroke={isSelected ? 'var(--accent-cyan)' : color}
              strokeWidth={isSelected ? 3 : 2}
              strokeLinecap="round"
              opacity={isSelected ? 1 : 0.8}
              pointerEvents="none"
              className={isFailed ? 'pulse-glow' : ''}
            />
            {isSelected && (
              <path
                d={path}
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1"
                strokeDasharray="4 4"
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
