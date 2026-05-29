import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Snapshot } from '../types';
import { MemoryNode } from './MemoryNode';
import { buildNodesAndEdges, type EdgeStyle } from '../utils/graphBuilder';

const nodeTypes = { memoryNode: MemoryNode };

interface MemoryCanvasProps {
  snapshot: Snapshot | null;
  onSnapshotReady?: () => void;
}

const MemoryCanvas: React.FC<MemoryCanvasProps> = ({ snapshot, onSnapshotReady }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [collapsedNodes, setCollapsedNodes] = React.useState<Set<string>>(new Set());
  const [edgeStyle, setEdgeStyle] = React.useState<EdgeStyle>(() => {
    return (localStorage.getItem('ds-edge-style') as EdgeStyle) || 'smoothstep';
  });
  const [layoutVersion, setLayoutVersion] = React.useState(0);
  const { fitView } = useReactFlow();
  const manualPositions = React.useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodePositionsRef = React.useRef<Map<string, { x: number; y: number }>>(new Map());

  // Sync ref with current node positions without triggering re-renders
  if (nodes.length > 0) {
    nodePositionsRef.current = new Map(nodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }]));
  }

  const handleNodeDragStop = useCallback((_event: any, node: Node) => {
    manualPositions.current.set(node.id, { x: node.position.x, y: node.position.y });
  }, []);

  const handleResetLayout = useCallback(() => {
    manualPositions.current.clear();
    setLayoutVersion((v) => v + 1);
  }, []);

  const handleCenterView = useCallback(() => {
    fitView({ duration: 400, padding: 0.2 });
  }, [fitView]);

  useEffect(() => {
    localStorage.setItem('ds-edge-style', edgeStyle);
  }, [edgeStyle]);

  useEffect(() => {
    if (!snapshot) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const result = buildNodesAndEdges(snapshot, collapsedNodes, setCollapsedNodes, edgeStyle, manualPositions.current, nodePositionsRef.current);
    setNodes(result.nodes);
    setEdges(result.edges);
    onSnapshotReady?.();
  }, [snapshot, collapsedNodes, edgeStyle, layoutVersion, setNodes, setEdges, onSnapshotReady]);

  if (!snapshot) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔬</div>
        <div className="empty-state__title">No Execution State</div>
        <div className="empty-state__text">
          Write some C++ code and click <strong>Run</strong> to start debugging.
          Memory allocations and data structures will appear here.
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-state__text">No memory data to display.</div>
      </div>
    );
  }

  return (
    <div className="unified-canvas" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1e35" />
        <Panel position="top-right">
          <div className="edge-style-panel">
            {(['smoothstep', 'straight', 'default'] as EdgeStyle[]).map((style) => (
              <button
                key={style}
                className={`edge-style-btn${edgeStyle === style ? ' edge-style-btn--active' : ''}`}
                onClick={() => setEdgeStyle(style)}
              >
                {style === 'smoothstep' ? 'Grid' : style === 'straight' ? 'Straight' : 'Curved'}
              </button>
            ))}
            <span className="edge-style-panel__divider" />
            <button className="edge-style-btn edge-style-btn--center" onClick={handleCenterView}>
              Center View
            </button>
            <span className="edge-style-panel__divider" />
            <button className="edge-style-btn edge-style-btn--reset" onClick={handleResetLayout}>
              Reset Layout
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export { MemoryCanvas };
