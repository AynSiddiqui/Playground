import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import dagre from '@dagrejs/dagre';

import type { Snapshot, Variable } from '../types';
import { MemoryNode } from './MemoryNode';
import { isSTLType, getBaseType, getCleanSTLTypeName } from '../utils/typeUtils';

type EdgeStyle = 'smoothstep' | 'straight' | 'default';

const nodeTypes = { memoryNode: MemoryNode };

function findSourceEdge(edges: Edge[], targetId: string): Edge | undefined {
  return edges.find(e => e.target === targetId && e.id.includes('struct'));
}

function getParentRelativeOffset(edgeId: string): { x: number; y: number } | null {
  if (edgeId.endsWith('-left')) return { x: -140, y: 180 };
  if (edgeId.endsWith('-right')) return { x: 140, y: 180 };
  if (edgeId.endsWith('-next')) return { x: 280, y: 0 };
  if (edgeId.endsWith('-prev')) return { x: -280, y: 0 };
  return null;
}

interface MemoryCanvasProps {
  snapshot: Snapshot | null;
}

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  manualPositions: Map<string, { x: number; y: number }>,
  currentNodePositions: Map<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const hasBinaryTree = nodes.some(
    (n) => {
      const adv = (n.data as any)?.advancedData;
      return adv?.type === 'BINARY_TREE';
    }
  );
  const rankdir = hasBinaryTree ? 'TB' : 'LR';

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, ranksep: 180, nodesep: 100 });

  nodes.forEach((node) => {
    const data = node.data as any;
    const cat = data?.category;
    const isVar = cat === 'variable';
    const isStl = cat === 'stl';
    const isHeap = cat === 'heap' || isStl;
    g.setNode(node.id, {
      width: isVar ? 160 : isStl ? 300 : isHeap ? 220 : 220,
      height: isVar ? 60 : isStl ? 150 : isHeap ? 130 : 130,
    });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const cached = manualPositions.get(node.id);
    if (cached) {
      return { ...node, position: { x: cached.x, y: cached.y } };
    }
    const isNew = !currentNodePositions.has(node.id);
    if (isNew) {
      const incoming = findSourceEdge(edges, node.id);
      if (incoming) {
        const offset = getParentRelativeOffset(incoming.id);
        if (offset) {
          const parentPos = currentNodePositions.get(incoming.source);
          if (parentPos) {
            return { ...node, position: { x: parentPos.x + offset.x, y: parentPos.y + offset.y } };
          }
        }
      }
    }
    const data = node.data as any;
    const cat = data?.category;
    const isVar = cat === 'variable';
    const isStl = cat === 'stl';
    const isHeap = cat === 'heap' || isStl;
    const defaultW = isVar ? 160 : isStl ? 300 : isHeap ? 220 : 220;
    const defaultH = isVar ? 60 : isStl ? 150 : isHeap ? 130 : 130;
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      return {
        ...node,
        position: {
          x: dagreNode.x - (dagreNode.width || defaultW) / 2,
          y: dagreNode.y - (dagreNode.height || defaultH) / 2,
        },
      };
    }
    return node;
  });

  return { nodes: layoutedNodes, edges };
}

function buildNodesAndEdges(
  snapshot: Snapshot,
  collapsedNodes: Set<string>,
  setCollapsedNodes: React.Dispatch<React.SetStateAction<Set<string>>>,
  edgeStyle: EdgeStyle,
  manualPositions: Map<string, { x: number; y: number }>,
  currentNodePositions: Map<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edgeMap = new Map<string, Edge>();
  const addressToNodeId = new Map<string, string>();
  const processedStructuralLinks = new Set<string>();
  const structuralNodeIds = new Set<string>();
  (snapshot.heap || []).forEach((obj) => addressToNodeId.set(obj.address, `heap-${obj.address}`));

  // Precompute a map of address -> size for STL containers / arrays from snapshot.heap
  const stlSizes = new Map<string, number>();
  (snapshot.heap || []).forEach((obj) => {
    if (obj.elements) {
      stlSizes.set(obj.address, obj.elements.length);
    } else if (obj.advancedData && obj.advancedData.elements) {
      stlSizes.set(obj.address, obj.advancedData.elements.length);
    } else if (obj.advancedData && obj.advancedData.rows) {
      stlSizes.set(obj.address, obj.advancedData.rows.length);
    }
  });

  (snapshot.stack || []).forEach((frame) => {
    (frame.locals || []).forEach((local) => {
      const nodeId = `stack-${frame.frameId}-var-${local.name}`;
      const isPointer = local.type && local.type.includes('*');
      const isReference = local.type && local.type.includes('&');
      const isSTLOrArray = isSTLType(local.type) || (local.type && local.type.includes('['));
      
      if (local.address && local.address !== '0x0' && !isPointer && !isReference && !isSTLOrArray) {
        addressToNodeId.set(local.address, nodeId);
      }
      
      const targetAddr = isPointer ? (local.address || local.value) : (isReference ? local.address : (isSTLOrArray ? local.address : null));

      let updatedLocal = { ...local };
      if (isSTLOrArray && local.address) {
        const size = stlSizes.get(local.address);
        const baseType = getBaseType(local.type);
        if (size !== undefined) {
          updatedLocal.value = `${baseType} (size=${size})`;
        } else {
          updatedLocal.value = `${baseType} (empty)`;
        }
      }
      (updatedLocal as any).cleanType = getCleanSTLTypeName(local.type);

      nodes.push({
        id: nodeId,
        type: 'memoryNode',
        position: { x: 0, y: 0 },
        data: {
          label: local.name,
          category: 'variable',
          variables: [updatedLocal],
          address: local.address,
          frameId: frame.frameId,
          line: frame.line,
        },
      });

      if (targetAddr && targetAddr !== '0x0' && targetAddr !== '0') {
        const targetNodeId = addressToNodeId.get(targetAddr);
        if (targetNodeId) {
          const edgeColor = isSTLOrArray ? '#f59e0b' : '#ec4899';
          const edgeObj = {
            id: `edge-stack-var-${frame.frameId}-${local.name}`,
            source: nodeId,
            sourceHandle: `${nodeId}-${local.name}`,
            target: targetNodeId,
            type: edgeStyle,
            animated: edgeStyle === 'smoothstep',
            style: { stroke: edgeColor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
          };
          edgeMap.set(edgeObj.id, edgeObj as Edge);
        }
      }

      ((local as any).fields || []).forEach((field: any) => {
        const targetAddr = field.address || field.value;
        if (targetAddr && targetAddr !== '0x0' && targetAddr !== '0') {
          const targetNodeId = addressToNodeId.get(targetAddr);
          if (targetNodeId) {
            const edgeObj = {
              id: `edge-stack-field-${frame.frameId}-${local.name}-${field.name}`,
              source: nodeId,
              sourceHandle: `${nodeId}-${field.name}`,
              target: targetNodeId,
              type: edgeStyle,
              animated: edgeStyle === 'smoothstep',
              style: { stroke: '#22d3ee', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
            };
            edgeMap.set(edgeObj.id, edgeObj as Edge);
          }
        }
      });

      const rawStackLinks = local.structuralLinks || (local as any).advancedData;
      if (rawStackLinks && (rawStackLinks.type === 'LINKED_LIST' || rawStackLinks.type === 'BINARY_TREE')) {
        const links = rawStackLinks;
        Object.entries(links.nodes).forEach(([addr]) => {
          const nodeId = 'heap-' + addr;
          if (!structuralNodeIds.has(nodeId)) {
            structuralNodeIds.add(nodeId);
            addressToNodeId.set(addr, nodeId);
            nodes.push({
              id: nodeId,
              type: 'memoryNode',
              position: { x: 0, y: 0 },
              data: {
                label: links.type + ' Node',
                category: 'heap',
                address: addr,
                variables: [],
                advancedData: rawStackLinks,
              },
            });
          }
        });
        Object.entries(links.nodes).forEach(([addr, nodeInfo]: [string, any]) => {
          const resolvedId = addressToNodeId.get(addr);
          if (!resolvedId) return;
          if (processedStructuralLinks.has(resolvedId)) return;
          processedStructuralLinks.add(resolvedId);
          const nodeLinks = nodeInfo.links || {};
          const value = nodeInfo.value || {};
          const subVariables: Variable[] = Object.entries(value).map(([k, v]) => ({
            name: k, type: typeof v, value: String(v),
          }));

          function addStructEdge(linkKey: string, color: string, edgeIdSuffix: string) {
            const targetAddr = nodeLinks[linkKey];
            if (!targetAddr) return;
            subVariables.push({ name: linkKey, type: 'Node*', value: targetAddr, address: targetAddr });
            const targetNodeId = addressToNodeId.get(targetAddr);
            if (!targetNodeId) return;
            const edgeObj = {
              id: `edge-stack-struct-${frame.frameId}-${addr}-${edgeIdSuffix}`,
              source: resolvedId,
              sourceHandle: `${resolvedId}-${linkKey}`,
              target: targetNodeId,
              type: edgeStyle,
              style: { stroke: color, strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color },
            };
            edgeMap.set(edgeObj.id, edgeObj as Edge);
          }
          addStructEdge('next', '#fb923c', 'next');
          addStructEdge('prev', '#f472b6', 'prev');
          addStructEdge('left', '#a855f7', 'left');
          addStructEdge('right', '#22d3ee', 'right');
          const existing = nodes.find(n => n.id === resolvedId);
          if (existing) {
            (existing.data as any).variables = [...subVariables];
          }
        });
      }
    });
  });

  function processAdvancedDataOnHeap(
    heapObj: any,
    structuralNodeIds: Set<string>,
    addressToNodeId: Map<string, string>,
    processedStructuralLinks: Set<string>,
    nodes: Node[],
    edgeMap: Map<string, Edge>,
  ) {
    const rawLinks = heapObj.advancedData;
    if (!rawLinks || (rawLinks.type !== 'LINKED_LIST' && rawLinks.type !== 'BINARY_TREE')) {
      return;
    }
    const links = rawLinks;
    const existingNodeIds = new Set(nodes.map(n => n.id));

    // Pass 1: Create nodes for addresses in registry that don't exist yet
    Object.entries(links.nodes).forEach(([addr]) => {
      const nodeId = 'heap-' + addr;
      if (!structuralNodeIds.has(nodeId) && !existingNodeIds.has(nodeId)) {
        structuralNodeIds.add(nodeId);
        addressToNodeId.set(addr, nodeId);
        nodes.push({
          id: nodeId,
          type: 'memoryNode',
          position: { x: 0, y: 0 },
          data: {
            label: links.type + ' Node',
            category: 'heap',
            address: addr,
            variables: [],
            advancedData: rawLinks,
          },
        });
      }
    });

    // Pass 2: Create edges and populate variables from registry
    Object.entries(links.nodes).forEach(([addr, nodeInfo]: [string, any]) => {
      const resolvedId = addressToNodeId.get(addr);
      if (!resolvedId) return;
      if (processedStructuralLinks.has(resolvedId)) return;
      processedStructuralLinks.add(resolvedId);
      structuralNodeIds.add(resolvedId);

      const nodeLinks = nodeInfo.links || {};
      const value = nodeInfo.value || {};
      const subVariables: Variable[] = Object.entries(value).map(([k, v]) => ({
        name: k, type: typeof v, value: String(v),
      }));

      function addStructEdge(linkKey: string, color: string) {
        const targetAddr = nodeLinks[linkKey];
        if (!targetAddr) return;
        subVariables.push({ name: linkKey, type: 'Node*', value: targetAddr, address: targetAddr });
        const targetNodeId = addressToNodeId.get(targetAddr);
        if (!targetNodeId) return;
        const edgeObj = {
          id: `edge-heap-struct-${addr}-${linkKey}`,
          source: resolvedId,
          sourceHandle: `${resolvedId}-${linkKey}`,
          target: targetNodeId,
          type: edgeStyle,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
        edgeMap.set(edgeObj.id, edgeObj as Edge);
      }

      addStructEdge('next', '#fb923c');
      addStructEdge('prev', '#f472b6');
      addStructEdge('left', '#a855f7');
      addStructEdge('right', '#22d3ee');

      const existing = nodes.find(n => n.id === resolvedId);
      if (existing) {
        (existing.data as any).variables = [...subVariables];
      }
    });
  }

  (snapshot.heap || []).forEach((obj) => {
    const nodeId = `heap-${obj.address}`;
    if (structuralNodeIds.has(nodeId)) return;

    nodes.push({
      id: nodeId,
      type: 'memoryNode',
      position: { x: 0, y: 0 },
      data: {
        label: getCleanSTLTypeName(obj.type),
        rawType: obj.type,
        category: obj.isStl ? 'stl' : 'heap',
        address: obj.address,
        variables: obj.fields,
        elements: obj.elements,
        isStl: obj.isStl,
        advancedData: obj.advancedData,
        isCollapsed: collapsedNodes.has(nodeId),
        onToggleCollapse: () => {
          setCollapsedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
              next.delete(nodeId);
            } else {
              next.add(nodeId);
            }
            return next;
          });
        },
      },
    });

    processAdvancedDataOnHeap(obj, structuralNodeIds, addressToNodeId, processedStructuralLinks, nodes, edgeMap);

    const structuralFieldNames = new Set(['next', 'prev', 'left', 'right']);
    (obj.fields || []).forEach((field) => {
      if (structuralFieldNames.has(field.name) && structuralNodeIds.has(nodeId)) return;
      const targetAddr = field.address || field.value;
      if (targetAddr && targetAddr !== '0x0' && targetAddr !== '0') {
        const targetNodeId = addressToNodeId.get(targetAddr);
        if (targetNodeId) {
          const edgeObj = {
            id: `edge-heap-${obj.address}-${field.name}`,
            source: nodeId,
            sourceHandle: `${nodeId}-${field.name}`,
            target: targetNodeId,
            type: edgeStyle,
            animated: edgeStyle === 'smoothstep',
            style: { stroke: '#22d3ee', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
          };
          edgeMap.set(edgeObj.id, edgeObj as Edge);
        }
      }
    });
  });

  return getLayoutedElements(nodes, Array.from(edgeMap.values()), manualPositions, currentNodePositions);
}

const MemoryCanvas: React.FC<MemoryCanvasProps> = ({ snapshot }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [collapsedNodes, setCollapsedNodes] = React.useState<Set<string>>(new Set());
  const [edgeStyle, setEdgeStyle] = React.useState<EdgeStyle>(() => {
    return (localStorage.getItem('ds-edge-style') as EdgeStyle) || 'smoothstep';
  });
  const [layoutVersion, setLayoutVersion] = React.useState(0);
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
  }, [snapshot, collapsedNodes, edgeStyle, layoutVersion, setNodes, setEdges]);

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
