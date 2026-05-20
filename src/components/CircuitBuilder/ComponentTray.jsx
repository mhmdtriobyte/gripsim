import { memo, useCallback } from 'react';

const COMPONENT_TYPES = [
  {
    type: 'arduino',
    label: 'Arduino Uno',
    color: '#1a472a',
    width: 240,
    height: 140,
  },
  {
    type: 'robotic-arm',
    label: 'Robotic Arm',
    color: '#3a3a3a',
    width: 150,
    height: 320,
  },
  {
    type: 'power',
    label: '5V Power Supply',
    color: '#2a2a2a',
    width: 100,
    height: 70,
  },
  {
    type: 'breadboard',
    label: 'Breadboard',
    color: '#e8e8d8',
    width: 260,
    height: 140,
  },
  {
    type: 'usb',
    label: 'USB Cable',
    color: '#555',
    width: 120,
    height: 40,
  },
];

const ComponentTray = memo(function ComponentTray({ onAddComponent }) {
  const handleDragStart = useCallback(
    (e, compType) => {
      e.dataTransfer.setData('componentType', compType.type);
      e.dataTransfer.setData('componentWidth', String(compType.width));
      e.dataTransfer.setData('componentHeight', String(compType.height));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  return (
    <div className="w-[140px] border-r border-[var(--border)] overflow-y-auto p-2 space-y-2 flex-shrink-0">
      <div className="font-mono text-[10px] text-[var(--text-dim)] mb-1 uppercase tracking-wider">
        Components
      </div>
      {COMPONENT_TYPES.map((comp) => (
        <div
          key={comp.type}
          draggable
          onDragStart={(e) => handleDragStart(e, comp)}
          className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border)] cursor-grab active:cursor-grabbing hover:border-[var(--accent-cyan)]/50 transition-all hover:shadow-[0_0_10px_rgba(0,255,240,0.1)]"
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-4 h-3 rounded-sm"
              style={{ backgroundColor: comp.color }}
            />
            <span className="font-mono text-[10px] text-[var(--text-primary)]">
              {comp.label}
            </span>
          </div>
          <div className="font-mono text-[8px] text-[var(--text-dim)]">
            {comp.width}x{comp.height}
          </div>
        </div>
      ))}
    </div>
  );
});

export default ComponentTray;
