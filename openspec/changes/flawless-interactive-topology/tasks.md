## 1. Canvas State Architecture
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx`, import `useNodesState`, `useEdgesState`, and `useEffect`.
- [x] 1.2 Refactor `MemoryCanvas` to utilize the state hooks instead of `useMemo`. Pass `onNodesChange` and `onEdgesChange` to `<ReactFlow>`.
- [x] 1.3 Add a `useEffect` that listens to `[snapshot]`. When triggered, run `buildNodesAndEdges` followed by `getLayoutedElements`, and update the state via `setNodes` and `setEdges`.

## 2. Guaranteed Data Hydration (Arrow Fix)
- [x] 2.1 In `MemoryCanvas.tsx` inside the `obj.structuralLinks` iteration block, locate the `const existing = nodes.find(...)` check.
- [x] 2.2 Delete the `if (!ed.variables || ed.variables.length === 0)` condition. Replace it with an unconditional `ed.variables = subVariables;` to ensure Handles are generated.

## 3. Multiple Pointer Badges
- [x] 3.1 In `MemoryCanvas.tsx::buildNodesAndEdges`, loop through `snapshot.stack[].locals`. For variables pointing to valid heap addresses, append their names to a `pointerLabels` Map instead of creating standalone nodes.
- [x] 3.2 Inject `labels: pointerLabels.get(obj.address) || []` into the heap nodes.
- [x] 3.3 Ensure `MemoryNode.tsx` iterates over `labels` and draws multiple badges side-by-side if multiple variables point to the same node.
