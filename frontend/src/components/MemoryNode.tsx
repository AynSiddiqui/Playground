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
  value?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  [key: string]: unknown;
}

const cleanType = (t: string): string => {
  if (!t) return '';
  let prev = '';
  let curr = t.trim();
  while (curr !== prev) {
    prev = curr;
    curr = curr.replace(/^(const|volatile|class|struct)\s+/, '');
    curr = curr.replace(/^::/, '');
    curr = curr.trim();
  }
  return curr;
};

const isSTLType = (type: string): boolean => {
  if (!type) return false;
  const clean = cleanType(type);
  return clean.startsWith('std::vector') ||
         clean.startsWith('std::map') ||
         clean.startsWith('std::unordered_map') ||
         clean.startsWith('std::set') ||
         clean.startsWith('std::unordered_set') ||
         clean.startsWith('std::list') ||
         clean.startsWith('std::deque') ||
         clean.startsWith('std::stack') ||
         clean.startsWith('std::queue') ||
         clean.startsWith('std::priority_queue') ||
         clean.startsWith('std::pair') ||
         clean.startsWith('std::array');
};

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
      <div
        className={`memory-node__header memory-node__header--${category}`}
        title={nodeData.rawType as string}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {category === 'stack' ? '📦' : category === 'variable' ? '📍' : isStl ? '🗂️' : '💾'}{' '}
          {label}
          {category !== 'variable' && nodeData.line ? ` :${nodeData.line}` : ''}
        </span>
        {isStl && nodeData.onToggleCollapse && (
          <button
            className="memory-node__collapse-toggle"
            onClick={(e) => {
              e.stopPropagation();
              (nodeData.onToggleCollapse as () => void)();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '2px 4px',
              fontFamily: 'inherit',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease',
              transform: nodeData.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </button>
        )}
      </div>

      {/* Body */}
      {!nodeData.isCollapsed && (
        <div className="memory-node__body">
        {/* Variable nodes: compact single-row */}
         {category === 'variable' && variables.map((v: Variable) => (
           <div key={v.name} className="memory-node__row">
             <span className="memory-node__type">{v.type}</span>
             <span className="memory-node__value">{v.value}</span>
             {(v.type.includes('*') || isSTLType(v.type)) && (
               <Handle
                 type="source"
                 position={Position.Right}
                 id={`${id}-${v.name}`}
                 style={{ background: isSTLType(v.type) ? '#f59e0b' : '#22d3ee', top: 14 }}
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
        {(!advancedData || advancedData.error) && isStl && elements.map((el: STLElement) => (
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

        {/* Render STL Container (map, set, etc.) elements from advancedData */}
        {advancedData && (advancedData.type === 'STL_CONTAINER' || advancedData.structType === 'STL_CONTAINER') && advancedData.elements && (
          <table className="stl-map-table">
            <thead>
              <tr>
                <th className="stl-map-header-key">Key</th>
                <th className="stl-map-header-value">Value</th>
              </tr>
            </thead>
            <tbody>
              {advancedData.elements.map((el: any, idx: number) => (
                <tr key={el.key ?? el.index ?? idx} className="stl-map-row">
                  <td className="stl-map-cell-key">
                    {el.key !== undefined ? String(el.key) : el.index !== undefined ? `[${el.index}]` : `[${idx}]`}
                  </td>
                  <td className="stl-map-cell-value">
                    {String(el.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}


        {/* Render 1D Vector/Array elements from advancedData */}
        {advancedData && (advancedData.type === 'ARRAY_1D' || advancedData.structType === 'ARRAY_1D') && advancedData.elements && (
          <div className="memory-node__array-1d" style={{ width: '100%' }}>
            {advancedData.elements.map((el: any) => (
              <div key={el.index} className="memory-node__row">
                <span className="memory-node__name">[{el.index}]</span>
                <span className="memory-node__value" style={{ marginLeft: 'auto' }}>
                  {el.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Render 2D Vector / Matrix elements */}
        {advancedData && (advancedData.type === 'MATRIX_2D' || advancedData.structType === 'MATRIX_2D' || advancedData.structure === 'matrix') && advancedData.rows && (
          <div className="memory-node__matrix" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${advancedData.dimensions?.[1] || (Array.isArray(advancedData.rows[0]) ? advancedData.rows[0].length : (advancedData.rows[0]?.elements?.length || 1))}, 1fr)`,
            gap: '4px',
            padding: '8px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {advancedData.rows.map((row: any, rIdx: number) => {
              const rowElements = Array.isArray(row) ? row : (row.elements || []);
              return rowElements.map((el: any, cIdx: number) => {
                const val = (el && typeof el === 'object' && 'value' in el) ? el.value : String(el);
                return (
                  <div key={`${rIdx}-${cIdx}`} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px',
                    textAlign: 'center',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {val}
                  </div>
                );
              });
            })}
          </div>
        )}

        {advancedData && (
          advancedData.structure === 'tree_node' ||
          advancedData.structure === 'list_node' ||
          advancedData.type === 'BINARY_TREE' ||
          advancedData.type === 'LINKED_LIST'
        ) && (
           <div className="memory-node__advanced">
             {Object.entries(advancedData).map(([k, v]) => {
                if (k !== 'structure' && k !== 'type' && k !== 'root' && k !== 'nodes' && k !== 'left' && k !== 'right' && k !== 'next') {
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

        {/* Render raw evaluated value string as fallback if no structured data is available */}
        {category === 'heap' && variables.length === 0 && (!elements || elements.length === 0) && (!advancedData || (!advancedData.elements && !advancedData.rows)) && nodeData.value && (
          <div className="memory-node__row" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
            <span className="memory-node__value">{nodeData.value}</span>
          </div>
        )}
      </div>
    )}

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
