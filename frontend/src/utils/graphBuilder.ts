import {
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';

import dagre from '@dagrejs/dagre';

import type { Snapshot, Variable } from '../types';
import { isSTLType, getBaseType, getCleanSTLTypeName } from './typeUtils';

export type EdgeStyle = 'smoothstep' | 'straight' | 'default';

export function findSourceEdge(edges: Edge[], targetId: string): Edge | undefined {
  return edges.find(e => e.target === targetId && e.id.includes('struct'));
}

export function getParentRelativeOffset(edgeId: string): { x: number; y: number } | null {
  if (edgeId.endsWith('-left')) return { x: -140, y: 180 };
  if (edgeId.endsWith('-right')) return { x: 140, y: 180 };
  if (edgeId.endsWith('-next')) return { x: 280, y: 0 };
  if (edgeId.endsWith('-prev')) return { x: -280, y: 0 };
  return null;
}

export function getLayoutedElements(
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

  // 1. Build children map for heap structural edges
  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    const isStructural = edge.id.includes('struct') && (
      edge.id.endsWith('-left') ||
      edge.id.endsWith('-right') ||
      edge.id.endsWith('-next') ||
      edge.id.endsWith('-prev')
    );
    if (isStructural) {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    }
  });

  // 2. Compute base Dagre layout positions
  const dagrePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    const data = node.data as any;
    const cat = data?.category;
    const isVar = cat === 'variable';
    const isStl = cat === 'stl';
    const isHeap = cat === 'heap' || isStl;
    const defaultW = isVar ? 160 : isStl ? 300 : isHeap ? 220 : 220;
    const defaultH = isVar ? 60 : isStl ? 150 : isHeap ? 130 : 130;
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      dagrePositions.set(node.id, {
        x: dagreNode.x - (dagreNode.width || defaultW) / 2,
        y: dagreNode.y - (dagreNode.height || defaultH) / 2,
      });
    } else {
      dagrePositions.set(node.id, { x: node.position.x, y: node.position.y });
    }
  });

  // 3. Compute deltas for manually positioned nodes
  const deltas = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    const manual = manualPositions.get(node.id);
    if (manual) {
      const dagrePos = dagrePositions.get(node.id)!;
      deltas.set(node.id, {
        x: manual.x - dagrePos.x,
        y: manual.y - dagrePos.y,
      });
    }
  });

  // 4. Propagate deltas down structural subtrees (DFS)
  const visited = new Set<string>();
  const finalDeltas = new Map<string, { x: number; y: number }>();

  function propagate(nodeId: string, currentDelta: { x: number; y: number } | null) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const nodeDelta = deltas.get(nodeId) || currentDelta;
    if (nodeDelta) {
      finalDeltas.set(nodeId, nodeDelta);
    }

    const children = childrenMap.get(nodeId) || [];
    children.forEach((childId) => {
      propagate(childId, nodeDelta);
    });
  }

  // Start propagation from root nodes (no incoming structural edges)
  const hasIncomingStruct = new Set<string>();
  edges.forEach((edge) => {
    const isStructural = edge.id.includes('struct') && (
      edge.id.endsWith('-left') ||
      edge.id.endsWith('-right') ||
      edge.id.endsWith('-next') ||
      edge.id.endsWith('-prev')
    );
    if (isStructural) {
      hasIncomingStruct.add(edge.target);
    }
  });

  nodes.forEach((node) => {
    if (!hasIncomingStruct.has(node.id)) {
      propagate(node.id, null);
    }
  });

  // Fallback for cycles / disconnected components
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      propagate(node.id, null);
    }
  });

  // 5. Apply manual offset propagation to final layouts
  const layoutedNodes = nodes.map((node) => {
    const dagrePos = dagrePositions.get(node.id)!;
    const delta = finalDeltas.get(node.id);

    if (delta) {
      return {
        ...node,
        position: {
          x: dagrePos.x + delta.x,
          y: dagrePos.y + delta.y,
        },
      };
    }

    return {
      ...node,
      position: { x: dagrePos.x, y: dagrePos.y },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function processAdvancedDataOnHeap(
  heapObj: any,
  structuralNodeIds: Set<string>,
  addressToNodeId: Map<string, string>,
  processedStructuralLinks: Set<string>,
  nodes: Node[],
  edgeMap: Map<string, Edge>,
  edgeStyle: EdgeStyle,
) {
  const rawLinks = heapObj.advancedData;
  if (!rawLinks || (rawLinks.type !== 'LINKED_LIST' && rawLinks.type !== 'BINARY_TREE')) {
    return;
  }
  const links = rawLinks;
  const existingNodeIds = new Set(nodes.map(n => n.id));

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

    processAdvancedDataOnHeap(obj, structuralNodeIds, addressToNodeId, processedStructuralLinks, nodes, edgeMap, edgeStyle);

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

export { buildNodesAndEdges };
