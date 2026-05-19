import { memo } from 'react';
import { useGripSim } from '../context/GripSimContext';

const Header = memo(function Header() {
  const { state, dispatch } = useGripSim();

  const statusColor = state.handDetected
    ? 'bg-[var(--accent-green)]'
    : 'bg-[var(--text-dim)]';

  const statusText = state.handDetected
    ? 'Hand Detected'
    : state.webcamActive
      ? 'No Hand'
      : 'Offline';

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-lg font-bold tracking-wider text-[var(--accent-cyan)]">
          GripSim
        </h1>
        <span className="font-mono text-xs text-[var(--text-dim)]">
          Vision-Controlled Robotic Gripper IDE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${statusColor} ${
              state.handDetected ? 'pulse-glow' : ''
            }`}
          />
          <span className="font-mono text-xs text-[var(--text-dim)]">
            {statusText}
          </span>
        </div>

        {state.webcamActive && (
          <span className="font-mono text-xs text-[var(--accent-cyan)]">
            {state.fps} FPS
          </span>
        )}

        <button
          onClick={() =>
            dispatch({
              type: 'SET_WEBCAM_ACTIVE',
              payload: !state.webcamActive,
            })
          }
          className={`font-mono text-xs px-3 py-1 rounded border transition-all ${
            state.webcamActive
              ? 'border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10'
              : 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10'
          }`}
        >
          {state.webcamActive ? 'Stop Webcam' : 'Start Webcam'}
        </button>
      </div>
    </header>
  );
});

export default Header;
