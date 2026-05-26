## 1. Unified Canvas Restoration
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx`, remove the separate polymorphic blocks (`<StackPanel>`, `<GridRenderer>`, `<LinearChainRenderer>`, `<HierarchicalTreeRenderer>`) and completely delete their files.
- [x] 1.2 In `MemoryCanvas.tsx`, implement a singular `<ReactFlow>` canvas.
- [x] 1.3 In `MemoryCanvas.tsx`, map all `stack` objects into `<ReactFlow>` nodes (e.g. creating a single large `MemoryNode` representing the stack frame).
- [x] 1.4 In `MemoryCanvas.tsx`, map all `heap` objects into independent `<ReactFlow>` nodes.

## 2. Dynamic Edges & Layout Engine
- [x] 2.1 In `MemoryCanvas.tsx`, iterate through `stack` pointers and `heap` pointers, creating `<Edge>` objects that explicitly draw paths from pointers to their targets by matching `address`. Ensure all edges use `MarkerType.ArrowClosed`.
- [x] 2.2 Re-implement the `getLayoutedElements` function using Dagre to automatically align the unified node/edge topology.

## 3. Rendering Stability
- [x] 3.1 Ensure React Flow instances have stable string IDs based on object memory addresses to allow smooth DOM transitions.
