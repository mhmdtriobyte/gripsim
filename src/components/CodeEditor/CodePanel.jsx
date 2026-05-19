import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useGripSim } from '../../context/GripSimContext';
import { MAIN_PY, ARDUINO_INO } from './codeSnippets';

const TABS = [
  { id: 'main.py', label: 'main.py', language: 'python', code: MAIN_PY },
  { id: 'arduino.ino', label: 'arduino.ino', language: 'cpp', code: ARDUINO_INO },
];

const CodePanel = memo(function CodePanel() {
  const { state, dispatch } = useGripSim();
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const activeTab = TABS.find((t) => t.id === state.activeCodeTab) || TABS[0];
  const isActive = state.activePanel === 'code';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(activeTab.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [activeTab.code]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !state.highlightLine) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const line = state.highlightLine.line || state.highlightLine;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
      range: new monaco.Range(line, 1, line, 1),
      options: { isWholeLine: true, className: 'highlight-line' },
    }]);
    const timer = setTimeout(() => {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }, 300);
    return () => clearTimeout(timer);
  }, [state.highlightLine]);

  return (
    <div
      className={`panel h-full flex flex-col ${isActive ? 'panel-active' : ''}`}
      onMouseDown={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'code' })}
    >
      <div className="flex items-center border-b border-[var(--border)] justify-between">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                dispatch({ type: 'SET_ACTIVE_CODE_TAB', payload: tab.id })
              }
              className={`px-4 py-2 font-mono text-xs transition-colors ${
                state.activeCodeTab === tab.id
                  ? 'text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)] bg-[var(--bg-elevated)]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="mr-3 px-2 py-1 font-mono text-[10px] rounded border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)] transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          theme="vs-dark"
          language={activeTab.language}
          value={activeTab.code}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
          options={{
            readOnly: false,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
});

export default CodePanel;
