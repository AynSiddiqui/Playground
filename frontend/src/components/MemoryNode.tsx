import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Variable, STLElement } from '../types';

interface MemoryNodeData {
  label: string;
  category: 'stack' | 'heap' | 'stl' | 'variable';
  variables?: Variable[];
  elements?: STLElement[];
  address?: string;
  isStl?: boolean;
  frameId?: string;
  line?: number;
  advancedData?: any;
  [key: string]: unknown;
}

/**
 * Custom React Flow node for rendering memory visualizations.
 * Renders differently based on category: stack frame, heap struct, or STL container.
 */
const MemoryNode: React.FC<NodeProps> = ({ data, id }) => {
  const nodeData = data as MemoryNodeData;
  const { label, category, address, isStl, advancedData } = nodeData;
  const variables = nodeData.variables || [];
  const elements = nodeData.elements || [];

  return (
    <div className={`memory-node animate-fade-in`}>
      {/* Input handle for incoming pointer edges */}
      <Handle type="target" position={Position.Left} style={{ background: '#a855f7' }} />

      {/* Header */}
      <div className={`memory-node__header memory-node__header--${category}`}>
        {category === 'stack' ? '📦' : category === 'variable' ? '📍' : isStl ? '🗂️' : '💾'}{' '}
        {label}
        {category !== 'variable' && nodeData.line ? ` :${nodeData.line}` : ''}
      </div>

      {/* Body */}
      <div className="memory-node__body">
        {/* Variable nodes: compact single-row */}
        {category === 'variable' && variables.map((v: Variable, i: number) => (
          <div key={v.name} className="memory-node__row">
            <span className="memory-node__type">{v.type}</span>
            <span className="memory-node__value">{v.value}</span>
            {v.type.includes('*') && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${v.name}`}
                style={{ background: '#22d3ee', top: 14 }}
              />
            )}
          </div>
        ))}

        {/* Render struct fields / local variables (non-variable nodes) */}
        {category !== 'variable' && variables.map((v: Variable, i: number) => (
          <div key={v.name} className="memory-node__row">
            <span className="memory-node__name">{v.name}</span>
            <span className="memory-node__type">{v.type}</span>
            <span className="memory-node__value">{v.value}</span>
            {/* Output handle for pointer variables */}
            {v.type.includes('*') && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${v.name}`}
                style={{
                  background: '#22d3ee',
                  top: `${50 + i * 32}px`,
                }}
              />
            )}
          </div>
        ))}

        {/* Render STL container elements */}
        {!advancedData && isStl && elements.map((el: STLElement) => (
          <div key={el.key ?? el.index} className="memory-node__row">
            {el.key !== undefined && (
              <span className="memory-node__name">{el.key}</span>
            )}
            {el.index !== undefined && el.key === undefined && (
              <span className="memory-node__name">[{el.index}]</span>
            )}
            <span className="memory-node__value" style={{ marginLeft: 'auto' }}>
              {el.value}
            </span>
          </div>
        ))}

        {/* Render Advanced Data Structures */}
        {advancedData && advancedData.structure === 'matrix' && (
          <div className="memory-node__matrix" style={{ display: 'grid', gridTemplateColumns: `repeat(${advancedData.rows[0]?.elements?.length || 1}, 1fr)`, gap: '4px', padding: '8px' }}>
            {advancedData.rows.map((row: any, rIdx: number) =>
              row.elements?.map((el: any, cIdx: number) => (
                <div key={`${rIdx}-${cIdx}`} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', textAlign: 'center', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  {el.value}
                </div>
              ))
            )}
          </div>
        )}

        {advancedData && (advancedData.structure === 'tree_node' || advancedData.structure === 'list_node') && (
           <div className="memory-node__advanced">
             {Object.entries(advancedData).map(([k, v]) => {
                if (k !== 'structure' && k !== 'left' && k !== 'right' && k !== 'next') {
                  return (
                    <div key={k} className="memory-node__row">
                      <span className="memory-node__name">{k}</span>
                      <span className="memory-node__value">{String(v)}</span>
                    </div>
                  );
                }
                return null;
             })}
            </div>
        )}
      </div>

      {/* Address footer for heap objects */}
      {address && (
        <div className="memory-node__address">
          📍 {address}
        </div>
      )}
    </div>
  );
};

export { MemoryNode };
