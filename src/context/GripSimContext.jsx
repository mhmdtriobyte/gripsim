import { createContext, useContext, useReducer, useCallback, useRef } from 'react';

const GripSimContext = createContext(null);

const initialState = {
  fingerStates: [0, 0, 0, 0],
  thumbState: 0,
  wristAngle: 90,
  gesture: 'NONE',
  handDetected: false,
  fps: 0,

  gripperAngle: 0,
  rotationAngle: 90,
  rotationLocked: false,

  components: [],
  wires: [],
  circuitValid: false,
  validationReport: [],
  failedWireIds: [],

  serialLog: [],

  handLandmarks: null,
  projectiles: [],

  webcamActive: false,
  activeCodeTab: 'main.py',
  activePanel: null,
  highlightLine: null,
  availableCameras: [],
  selectedCameraId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_HAND_TRACKING':
      return { ...state, ...action.payload };
    case 'SET_HAND_LANDMARKS':
      return { ...state, handLandmarks: action.payload };
    case 'SET_SERVO_ANGLES':
      return {
        ...state,
        gripperAngle: action.payload.gripperAngle ?? state.gripperAngle,
        rotationAngle: action.payload.rotationAngle ?? state.rotationAngle,
      };
    case 'SET_WEBCAM_ACTIVE':
      return { ...state, webcamActive: action.payload };
    case 'SET_ACTIVE_CODE_TAB':
      return { ...state, activeCodeTab: action.payload };

    case 'ADD_COMPONENT':
      return { ...state, components: [...state.components, action.payload] };
    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    case 'REMOVE_COMPONENT':
      return {
        ...state,
        components: state.components.filter((c) => c.id !== action.payload),
        wires: state.wires.filter(
          (w) =>
            w.sourceComponentId !== action.payload &&
            w.targetComponentId !== action.payload
        ),
      };
    case 'SET_COMPONENTS':
      return { ...state, components: action.payload };

    case 'ADD_WIRE':
      return { ...state, wires: [...state.wires, action.payload], failedWireIds: [] };
    case 'REMOVE_WIRE':
      return {
        ...state,
        wires: state.wires.filter((w) => w.id !== action.payload),
        failedWireIds: [],
      };
    case 'SET_WIRES':
      return { ...state, wires: action.payload };
    case 'CLEAR_CIRCUIT':
      return { ...state, components: [], wires: [], failedWireIds: [], circuitValid: false, validationReport: [] };

    case 'SET_CIRCUIT_VALID':
      return { ...state, circuitValid: action.payload };
    case 'SET_VALIDATION_REPORT':
      return {
        ...state,
        validationReport: action.payload.report,
        circuitValid: action.payload.valid,
      };

    case 'ADD_SERIAL_LOG':
      return {
        ...state,
        serialLog: [...state.serialLog.slice(-200), action.payload],
      };
    case 'CLEAR_SERIAL_LOG':
      return { ...state, serialLog: [] };

    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };
    case 'SET_ROTATION_LOCKED':
      return { ...state, rotationLocked: action.payload };
    case 'SET_FAILED_WIRES':
      return { ...state, failedWireIds: action.payload };
    case 'SET_HIGHLIGHT_LINE':
      return { ...state, highlightLine: action.payload };
    case 'SET_AVAILABLE_CAMERAS':
      return { ...state, availableCameras: action.payload };
    case 'SET_SELECTED_CAMERA':
      return { ...state, selectedCameraId: action.payload };

    case 'ADD_PROJECTILE':
      return { ...state, projectiles: [...state.projectiles, action.payload] };
    case 'SET_PROJECTILES':
      return { ...state, projectiles: action.payload };

    default:
      return state;
  }
}

export function GripSimProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const startTimeRef = useRef(Date.now());
  const logIdRef = useRef(0);

  const addSerialLog = useCallback(
    (message, type = 'info') => {
      const elapsed = Date.now() - startTimeRef.current;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      const ms = elapsed % 1000;
      const timestamp = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
      dispatch({
        type: 'ADD_SERIAL_LOG',
        payload: { timestamp, message, type, id: ++logIdRef.current },
      });
    },
    []
  );

  return (
    <GripSimContext.Provider value={{ state, dispatch, addSerialLog }}>
      {children}
    </GripSimContext.Provider>
  );
}

export function useGripSim() {
  const ctx = useContext(GripSimContext);
  if (!ctx) throw new Error('useGripSim must be used within GripSimProvider');
  return ctx;
}
