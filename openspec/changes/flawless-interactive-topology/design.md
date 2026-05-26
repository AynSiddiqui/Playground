## Context
The canvas uses `@dagrejs/dagre` inside a `useMemo` block. Because `ReactFlow` does not receive state updater functions (`onNodesChange`), any drag event is nullified. Furthermore, React Flow `<Edge>` objects strictly require a matching `<Handle id="source">` in the DOM to attach to. If the `next` variable is hidden or missing from the node data, the handle doesn't exist, and the edge disappears.

## Goals
- Make the entire graph interactive and draggable.
- Ensure structural variables (`data`, `next`, `left`, `right`) always render so their connecting arrows never drop.
- Convert multiple stack variables pointing to the same node into clean, floating tag badges on the node itself.

## Decisions
1. **Stateful Graph**: `MemoryCanvas.tsx` will utilize `useEffect` to intercept `snapshot` changes. Inside the effect, it builds the nodes, runs Dagre, and calls `setNodes()`/`setEdges()`. This seeds the initial layout but allows subsequent `onNodesChange` drag events to mutate positions.
2. **Aggressive Override**: When processing `structuralLinks` in the graph builder, we will unconditionally overwrite `existing.data.variables = subVariables`.
3. **Badge Map**: Before creating heap nodes, we loop `snapshot.stack[].locals`. We build a `Map<string, string[]>` of `address -> variableNames`. These are injected into `node.data.labels`, allowing `MemoryNode.tsx` to render multiple badges natively.
