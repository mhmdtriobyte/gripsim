import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { GripSimProvider } from './context/GripSimContext';
import Header from './components/Header';
import WebcamPanel from './components/WebcamPanel';
import CircuitCanvas from './components/CircuitBuilder/CircuitCanvas';
import ResizeDivider from './components/ResizeDivider';
import useMediaPipe from './hooks/useMediaPipe';
import { useGripSim } from './context/GripSimContext';

const CodePanel = lazy(() => import('./components/CodeEditor/CodePanel'));


function AppContent() {
  useMediaPipe();
  const containerRef = useRef(null);
  const [webcamWidth, setWebcamWidth] = useState(280);
  const [codeHeight, setCodeHeight] = useState(280);

  const handleWebcamResize = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setWebcamWidth(Math.max(200, Math.min(500, clientX - rect.left)));
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
        </div>
        <ResizeDivider direction="vertical" onResize={handleCodeResize} />
        <div style={{ height: codeHeight, minHeight: 150, flexShrink: 0 }} className="p-2 pt-0">
          <Suspense fallback={
            <div className="panel h-full flex items-center justify-center">
              <span className="font-mono text-xs text-[var(--text-dim)]">Loading editor...</span>
            </div>
          }>
            <CodePanel />
          </Suspense>
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
