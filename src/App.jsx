import { useState, useCallback, useRef } from 'react';
import { GripSimProvider } from './context/GripSimContext';
import Header from './components/Header';
import WebcamPanel from './components/WebcamPanel';
import CircuitCanvas from './components/CircuitBuilder/CircuitCanvas';
import ServoVisualizer from './components/ServoVisualizer/ServoVisualizer';
import CodePanel from './components/CodeEditor/CodePanel';
import ResizeDivider from './components/ResizeDivider';
import useMediaPipe from './hooks/useMediaPipe';
import { useGripSim } from './context/GripSimContext';


function AppContent() {
  useMediaPipe();
  const containerRef = useRef(null);
  const [webcamWidth, setWebcamWidth] = useState(280);
  const [servoWidth, setServoWidth] = useState(320);
  const [codeHeight, setCodeHeight] = useState(280);

  const handleWebcamResize = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setWebcamWidth(Math.max(200, Math.min(500, clientX - rect.left)));
  }, []);

  const handleServoResize = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setServoWidth(Math.max(250, Math.min(500, rect.right - clientX)));
  }, []);

  const handleCodeResize = useCallback((clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCodeHeight(Math.max(150, Math.min(500, rect.bottom - clientY)));
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col bg-[var(--bg-primary)]">
      <Header />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-1 min-h-0">
          <div style={{ width: webcamWidth, minWidth: 200, flexShrink: 0 }} className="p-2">
            <WebcamPanel />
          </div>
          <ResizeDivider direction="horizontal" onResize={handleWebcamResize} />
          <div className="flex-1 p-2 min-w-0">
            <CircuitCanvas />
          </div>
          <ResizeDivider direction="horizontal" onResize={handleServoResize} />
          <div style={{ width: servoWidth, minWidth: 250, flexShrink: 0 }} className="p-2">
            <ServoVisualizer />
          </div>
        </div>
        <ResizeDivider direction="vertical" onResize={handleCodeResize} />
        <div style={{ height: codeHeight, minHeight: 150, flexShrink: 0 }} className="p-2 pt-0">
          <CodePanel />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GripSimProvider>
      <AppContent />
    </GripSimProvider>
  );
}
