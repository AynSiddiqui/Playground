## 1. Dagre Layout Expansion
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx::getLayoutedElements`, conditionally set `dagreGraph.setGraph({ rankdir: 'TB' })` if the graph contains any nodes representing a `BINARY_TREE`. Otherwise, use `LR`.
- [x] 1.2 In `getLayoutedElements`, detect if the node is `category === 'stack'` and explicitly assign a significantly larger `width` (e.g. 400) and `height` (e.g. 250) to prevent edge routing overlap. Increase `ranksep` and `nodesep`.

## 2. Structural Data Hydration
- [x] 2.1 In `MemoryCanvas.tsx::buildNodesAndEdges`, inside the `obj.structuralLinks` iteration block, locate the existing node via `nodes.find(n => n.id === subNodeId)`. If it exists, backfill its `data.variables` with the constructed `subVariables` array to ensure inner fields are not empty.
- [x] 2.2 Verify `MemoryNode.tsx` properly renders the updated variables list so the box is no longer hollow.
