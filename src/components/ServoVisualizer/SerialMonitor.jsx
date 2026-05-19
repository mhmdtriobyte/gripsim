import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useGripSim } from '../../context/GripSimContext';

const TYPE_COLORS = {
  tx: 'var(--accent-cyan)',
  warning: '#ffcc00',
  error: 'var(--accent-red)',
  gesture: 'var(--accent-green)',
  info: 'var(--text-dim)',
};

const SerialMonitor = memo(function SerialMonitor() {
  const { state, dispatch } = useGripSim();
  const [paused, setPaused] = useState(false);
  const [baudRate, setBaudRate] = useState('9600');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.serialLog, paused]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR_SERIAL_LOG' });
  }, [dispatch]);

  const visibleLogs = paused
    ? state.serialLog
    : state.serialLog.slice(-100);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border)]">
        <span className="font-mono text-[10px] text-[var(--text-dim)] uppercase">
          Serial Monitor
        </span>
        <div className="flex items-center gap-2">
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(e.target.value)}
            className="font-mono text-[10px] bg-[var(--bg-elevated)] text-[var(--text-dim)] border border-[var(--border)] rounded px-1 py-0.5"
          >
            <option>9600</option>
            <option>115200</option>
          </select>
          <button
            onClick={() => setPaused((p) => !p)}
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
              paused
                ? 'border-[var(--accent-orange)] text-[var(--accent-orange)]'
                : 'border-[var(--border)] text-[var(--text-dim)]'
            }`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleClear}
            className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-0.5"
      >
        {visibleLogs.length === 0 ? (
          <div className="font-mono text-[10px] text-[var(--text-dim)]">
            Waiting for data...
          </div>
        ) : (
          visibleLogs.map((entry) => (
            <div
              key={entry.id}
              className="font-mono text-[10px] leading-relaxed"
              style={{ color: TYPE_COLORS[entry.type] || TYPE_COLORS.info }}
            >
              <span className="text-[var(--text-dim)]">
                [{entry.timestamp}]
              </span>{' '}
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default SerialMonitor;
