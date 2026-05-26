import React, { useState } from 'react';
import type { Snapshot } from '../types';

interface DebugPanelProps {
  currentSnapshot: Snapshot | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ currentSnapshot }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`debug-panel ${isOpen ? 'debug-panel--open' : ''}`}>
      <div 
        className="debug-panel__header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="debug-panel__title">⚙️ Raw JSON Payload Debugger</span>
        <span className="debug-panel__toggle">{isOpen ? '▼' : '▲'}</span>
      </div>
      
      {isOpen && (
        <div className="debug-panel__body">
          <pre className="debug-panel__json">
            {currentSnapshot 
              ? JSON.stringify(currentSnapshot, null, 2) 
              : 'No active snapshot.'}
          </pre>
        </div>
      )}
    </div>
  );
};
