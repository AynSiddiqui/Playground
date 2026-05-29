import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import { CodeEditor, DEFAULT_CODE } from './components/CodeEditor';
import { MemoryCanvas } from './components/MemoryCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { DebugPanel } from './components/DebugPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';
import { useTimeline } from './hooks/useTimeline';
import type { Snapshot } from './types';

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isFinished, setIsFinished] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);
  const [isStepping, setIsStepping] = useState(false);

  // Timeline state (the "Time Machine" cache)
  const {
    timeline,
    currentIndex,
    currentSnapshot,
    pushSnapshot,
    goBack,
    goForward,
    goTo,
    reset: resetTimeline,
    canGoBack,
  } = useTimeline();

  // WebSocket connection
  const handleSnapshot = useCallback((snapshot: Snapshot) => {
    pushSnapshot(snapshot);
    setIsFinished(false);
    setIsStepping(false);
  }, [pushSnapshot]);

  const handleFinished = useCallback((_exitCode: number) => {
    setIsFinished(true);
    setIsStepping(false);
  }, []);

  const {
    connect,
    sendStart,
    sendStep,
    sendStop,
    sendCommand,
    disconnect,
    isConnected,
    status,
    error,
  } = useWebSocket(handleSnapshot, handleFinished);

  const handleSnapshotReady = useCallback(() => {
    sendCommand({ command: 'snapshot_ready' });
  }, [sendCommand]);

  const handleGlobalReset = useCallback(() => {
    disconnect();
    resetTimeline();
    setIsFinished(false);
    setDismissedError(false);
    setIsStepping(false);
  }, [disconnect, resetTimeline]);

  // --- Action Handlers ---

  const handleRun = useCallback(() => {
    setIsFinished(false);
    setDismissedError(false);
    setIsStepping(false);
    resetTimeline();
    if (!isConnected) {
      connect();
      // Small delay to ensure connection is established
      setTimeout(() => sendStart(code), 300);
    } else {
      sendStart(code);
    }
  }, [code, isConnected, connect, sendStart, resetTimeline]);

  const handleStop = useCallback(() => {
    sendStop();
    setIsFinished(false);
    setIsStepping(false);
  }, [sendStop]);

  const handleNext = useCallback(() => {
    // If we're at the end of the cache, request a new step from the backend
    const advanced = goForward();
    if (!advanced) {
      if (isStepping) return;
      setIsStepping(true);
      sendStep();
    }
  }, [goForward, sendStep, isStepping]);

  const handlePrevious = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleReset = useCallback(() => {
    goTo(0);
  }, [goTo]);

  const handleSliderChange = useCallback((index: number) => {
    goTo(index);
  }, [goTo]);

  // Current line to highlight in the editor
  const highlightLine = currentSnapshot?.line ?? null;

  // Status badge styling
  const statusClass = error
    ? 'status-badge--error'
    : status === 'compiling' || status === 'launching'
    ? 'status-badge--compiling'
    : isConnected
    ? 'status-badge--connected'
    : '';

  const displayStatus = error ? 'Error' : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <div className="header__icon">⚡</div>
          <div>
            <div className="header__title">Memory Visualizer</div>
            <div className="header__subtitle">Interactive C++ Debugger</div>
          </div>
        </div>
        <div className="header__status">
          <span className={`status-badge ${statusClass}`}>
            <span className="status-dot" />
            {displayStatus}
          </span>
        </div>
      </header>

      {/* Error Banner */}
      {error && !dismissedError && (
        <div className="error-banner animate-slide-in">
          <span className="error-banner__icon">⚠️</span>
          {error}
          <button className="error-banner__dismiss" onClick={() => setDismissedError(true)}>
            ✕
          </button>
        </div>
      )}

      {/* Main Split Pane */}
      <main className="main-content">
        {/* Editor Pane */}
        <div className="pane pane--editor">
          <div className="pane__header">
            <span>📝 Code Editor</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              C++
            </span>
          </div>
          <div className="pane__body">
            <CodeEditor
              code={code}
              onCodeChange={setCode}
              highlightLine={highlightLine}
            />
          </div>
        </div>

        {/* Visualization Pane */}
        <div className="pane pane--visualization">
          <div className="pane__header">
            <span>🔬 Memory Visualization</span>
            {currentSnapshot && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                Line {currentSnapshot.line} • {currentSnapshot.stack?.length ?? 0} frame(s) • {currentSnapshot.heap?.length ?? 0} heap object(s)
              </span>
            )}
          </div>
          <div className="pane__body">
            <ErrorBoundary onReset={handleGlobalReset}>
              <ReactFlowProvider>
                <MemoryCanvas snapshot={currentSnapshot} onSnapshotReady={handleSnapshotReady} />
              </ReactFlowProvider>
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Playback Controls */}
      <PlaybackControls
        onRun={handleRun}
        onStop={handleStop}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onReset={handleReset}
        canGoBack={canGoBack}
        isRunning={isConnected && status === 'ready'}
        isFinished={isFinished}
        isStepping={isStepping}
        currentIndex={currentIndex}
        totalSteps={timeline.length}
        onSliderChange={handleSliderChange}
      />
      
      <DebugPanel currentSnapshot={currentSnapshot} />
    </div>
  );
}

export default App;
