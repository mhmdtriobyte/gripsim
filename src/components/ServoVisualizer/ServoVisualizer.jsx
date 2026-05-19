import { memo } from 'react';
import { useGripSim } from '../../context/GripSimContext';
import ServoGauge from './ServoGauge';
import GripperClaw from './GripperClaw';
import SerialMonitor from './SerialMonitor';

const ServoVisualizer = memo(function ServoVisualizer() {
  const { state, dispatch } = useGripSim();

  const noSignal = !state.webcamActive || !state.handDetected;
  const isActive = state.activePanel === 'servo';
  const receiving = state.webcamActive && state.handDetected;

  return (
    <div
      className={`panel h-full flex flex-col ${isActive ? 'panel-active' : ''}`}
      onMouseDown={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'servo' })}
    >
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <span className="font-mono text-xs font-semibold text-[var(--accent-cyan)]">
          SERVO VISUALIZER
        </span>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto flex flex-col items-center py-1 gap-0 min-h-0">
          <div className="w-full flex-1 flex items-center justify-center min-h-[200px] px-1">
            <GripperClaw gripperAngle={state.gripperAngle} rotationAngle={state.rotationAngle} />
          </div>
          <div className="w-full border-t border-[var(--border)]">
            <div className="flex justify-around">
              <ServoGauge
                label="Gripper"
                pin={3}
                angle={state.gripperAngle}
                color="var(--accent-cyan)"
                frozen={false}
                noSignal={noSignal}
                receiving={receiving}
              />
              <ServoGauge
                label="Rotation"
                pin={5}
                angle={state.rotationAngle}
                color="var(--accent-orange)"
                frozen={false}
                noSignal={noSignal}
                receiving={receiving}
                locked={state.rotationLocked}
              />
            </div>
          </div>
        </div>

        <div className="h-[200px] min-h-[200px] border-t border-[var(--border)]">
          <SerialMonitor />
        </div>
      </div>
    </div>
  );
});

export default ServoVisualizer;
