import { memo } from 'react';

const ValidationPanel = memo(function ValidationPanel({
  report,
  valid,
  onClose,
}) {
  return (
    <div className="absolute top-2 right-2 w-64 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          Validation Report
        </span>
        <button
          onClick={onClose}
          className="text-[var(--text-dim)] hover:text-[var(--text-primary)] text-sm"
        >
          x
        </button>
      </div>
      <div className="p-3 space-y-1.5">
        {report.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm">
              {item.pass ? '✅' : '❌'}
            </span>
            <span
              className="font-mono text-[10px]"
              style={{
                color: item.pass
                  ? 'var(--accent-green)'
                  : 'var(--accent-red)',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <span
            className="font-mono text-xs font-bold"
            style={{
              color: valid ? 'var(--accent-green)' : 'var(--accent-red)',
            }}
          >
            {valid ? 'CIRCUIT VALID' : 'CIRCUIT INVALID'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ValidationPanel;
