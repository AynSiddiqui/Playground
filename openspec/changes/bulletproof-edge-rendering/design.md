## Context
React Flow relies heavily on the `id` property of nodes and edges to serve as the React `key` during virtualization and rendering. When the `buildNodesAndEdges` loop pushes identical edges repeatedly (because Python `stl_printers` traverses the same sub-nodes multiple times), it poisons the edge array with duplicates.

## Goals
- Eradicate duplicate edge IDs in `MemoryCanvas.tsx`.
- Ensure React Flow registers the `ed.variables` override by properly mutating the state object so that inner values and `<Handle>` endpoints always show up.

## Decisions
1. **Edge Map Algorithm**: At the top of `buildNodesAndEdges`, `const edges: Edge[] = [];` will be replaced with `const edgeMap = new Map<string, Edge>();`. Every `edges.push(edge)` will become `edgeMap.set(edge.id, edge);`. At the end, `Array.from(edgeMap.values())` will be returned.
2. **State Triggers**: When overriding data for existing structural nodes, we will use spread operators `ed.variables = [...subVariables]` to ensure a new reference is created, triggering a definitive React re-render of the node's body.
