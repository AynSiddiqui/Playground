import React, { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
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

const nodeTypes = { memoryNode: MemoryNode };

interface MemoryCanvasProps {
  snapshot: Snapshot | null;
}

function getLayoutedElements(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const hasBinaryTree = nodes.some(
    (n) => (n.data as any)?.advancedData?.structure === 'tree_node'
  );
  const rankdir = hasBinaryTree ? 'TB' : 'LR';

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, ranksep: 180, nodesep: 100 });

  nodes.forEach((node) => {
    const data = node.data as any;
    const cat = data?.category;
    const isVar = cat === 'variable';
    const isHeap = cat === 'heap' || cat === 'stl';
    g.setNode(node.id, {
      width: isVar ? 160 : isHeap ? 220 : 220,
      height: isVar ? 60 : isHeap ? 130 : 130,
    });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const data = node.data as any;
    const cat = data?.category;
    const isVar = cat === 'variable';
    const isHeap = cat === 'heap' || cat === 'stl';
    const defaultW = isVar ? 160 : isHeap ? 220 : 220;
    const defaultH = isVar ? 60 : isHeap ? 130 : 130;
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

function buildNodesAndEdges(snapshot: Snapshot): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edgeMap = new Map<string, Edge>();
  const addressToNodeId = new Map<string, string>();
  const processedStructuralLinks = new Set<string>();
  const structuralNodeIds = new Set<string>();
  (snapshot.heap || []).forEach((obj) => addressToNodeId.set(obj.address, `heap-${obj.address}`));

  (snapshot.stack || []).forEach((frame) => {
    (frame.locals || []).forEach((local) => {
      const nodeId = `stack-${frame.frameId}-var-${local.name}`;
      const isPointer = local.type && local.type.includes('*');
      if (local.address && local.address !== '0x0' && !isPointer) addressToNodeId.set(local.address, nodeId);
      const targetAddr = isPointer ? (local.address || local.value) : null;

      nodes.push({
        id: nodeId,
        type: 'memoryNode',
        position: { x: 0, y: 0 },
        data: {
          label: local.name,
          category: 'variable',
          variables: [local],
          address: local.address,
          frameId: frame.frameId,
          line: frame.line,
        },
      });

      if (targetAddr && targetAddr !== '0x0' && targetAddr !== '0') {
        const targetNodeId = addressToNodeId.get(targetAddr);
        if (targetNodeId) {
          const edgeObj = {
            id: `edge-stack-var-${frame.frameId}-${local.name}`,
            source: nodeId,
            sourceHandle: `${nodeId}-${local.name}`,
            target: targetNodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#ec4899', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ec4899' },
          };
          edgeMap.set(edgeObj.id, edgeObj as Edge);
        }
      }

      (local.fields || []).forEach((field) => {
        const targetAddr = field.address || field.value;
        if (targetAddr && targetAddr !== '0x0' && targetAddr !== '0') {
          const targetNodeId = addressToNodeId.get(targetAddr);
          if (targetNodeId) {
            const edgeObj = {
              id: `edge-stack-field-${frame.frameId}-${local.name}-${field.name}`,
              source: nodeId,
              sourceHandle: `${nodeId}-${field.name}`,
              target: targetNodeId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#22d3ee', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
            };
            edgeMap.set(edgeObj.id, edgeObj as Edge);
          }
        }
      });

      const rawStackLinks = local.structuralLinks || local.advancedData;
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
        Object.entries(links.nodes).forEach(([addr, nodeInfo]) => {
          const resolvedId = addressToNodeId.get(addr);
          if (!resolvedId) return;
          if (processedStructuralLinks.has(resolvedId)) return;
          processedStructuralLinks.add(resolvedId);
          const nodeLinks = nodeInfo.links || {};
          const value = nodeInfo.value || {};
          const subVariables: Variable[] = Object.entries(value).map(([k, v]) => ({
            name: k, type: typeof v, value: v,
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
              type: 'smoothstep',
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
        name: k, type: typeof v, value: v,
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
          type: 'smoothstep' as const,
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
        label: obj.type,
        category: obj.isStl ? 'stl' : 'heap',
        address: obj.address,
        variables: obj.fields,
        elements: obj.elements,
        isStl: obj.isStl,
        advancedData: obj.advancedData,
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
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#22d3ee', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' },
          };
          edgeMap.set(edgeObj.id, edgeObj as Edge);
        }
      }
    });
  });

  return getLayoutedElements(nodes, Array.from(edgeMap.values()));
}

const MemoryCanvas: React.FC<MemoryCanvasProps> = ({ snapshot }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!snapshot) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const result = buildNodesAndEdges(snapshot);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [snapshot, setNodes, setEdges]);

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
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1e35" />
      </ReactFlow>
    </div>
  );
};

export { MemoryCanvas };
