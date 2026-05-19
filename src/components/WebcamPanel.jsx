import { memo } from 'react';
import { useGripSim } from '../context/GripSimContext';

const FINGER_LABELS = ['Index', 'Middle', 'Ring', 'Pinky'];

const WebcamPanel = memo(function WebcamPanel() {
  const { state, dispatch } = useGripSim();
  const isActive = state.activePanel === 'webcam';

  return (
    <div
      className={`panel h-full flex flex-col ${isActive ? 'panel-active' : ''}`}
      onMouseDown={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'webcam' })}
    >
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-[var(--accent-cyan)] shrink-0">
          WEBCAM
        </span>
        {state.availableCameras.length > 1 && (
          <select
            value={state.selectedCameraId || ''}
            onChange={(e) => {
              dispatch({ type: 'SET_SELECTED_CAMERA', payload: e.target.value || null });
            }}
            className="font-mono text-[10px] bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] rounded px-1 py-0.5 min-w-0 truncate outline-none focus:border-[var(--accent-cyan)]"
          >
            {state.availableCameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center min-h-0">
        {!state.webcamActive ? (
          <div className="text-center">
            <div className="text-[var(--text-dim)] font-mono text-sm mb-2">
              Camera Offline
            </div>
            <div className="text-[var(--text-dim)] font-mono text-xs">
              Click "Start Webcam" to begin
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative" id="webcam-container">
            <video
              id="webcam-video"
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
              autoPlay
              playsInline
              muted
            />
            <canvas
              id="webcam-canvas"
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="scanline-overlay" />
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[var(--border)] space-y-2">
        <div className="flex items-center gap-2">
          {FINGER_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    state.fingerStates[i] === 1
                      ? 'var(--accent-green)'
                      : 'var(--accent-red)',
                }}
              />
              <span className="font-mono text-[10px] text-[var(--text-dim)]">
                {label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  state.thumbState === 1
                    ? 'var(--accent-green)'
                    : 'var(--accent-red)',
              }}
            />
            <span className="font-mono text-[10px] text-[var(--text-dim)]">
              Thumb
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span
            className="font-mono text-xs font-semibold"
            style={{
              color: state.gesture === 'NONE'
                ? 'var(--text-dim)'
                : 'var(--accent-green)',
            }}
          >
            {state.gesture}
          </span>
          <div className="flex items-center gap-2">
            {state.webcamActive && (
              <span className="font-mono text-[10px] text-[var(--accent-cyan)]">
                {state.fps} FPS
              </span>
            )}
            {!state.handDetected && state.webcamActive && (
              <span className="font-mono text-[10px] text-[var(--accent-orange)]">
                No hand detected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WebcamPanel;
