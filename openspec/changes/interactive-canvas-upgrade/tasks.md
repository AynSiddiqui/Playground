## 1. Canvas State Architecture
- [ ] 1.1 In `frontend/src/components/MemoryCanvas.tsx`, import `useNodesState` and `useEdgesState` from `@xyflow/react`.
- [ ] 1.2 Replace the stateless `useMemo` node builder with a `useEffect` that triggers on `[snapshot]` changes. Call `buildNodesAndEdges(snapshot)` and use `setNodes()` and `setEdges()` to initialize the graph state.
- [ ] 1.3 Pass the `onNodesChange` and `onEdgesChange` functions to the `<ReactFlow>` component so nodes become fully draggable.

## 2. Guaranteed Data Hydration
- [ ] 2.1 In `MemoryCanvas.tsx` inside the `obj.structuralLinks` iteration block, locate the `const existing = nodes.find(...)` block.
- [ ] 2.2 Delete the `if (!ed.variables || ed.variables.length === 0)` check. Replace it with an unconditional `ed.variables = subVariables;` to enforce that internal variables like `data` and `next` are perfectly populated on screen.
- [ ] 2.3 Verify that because `next` (of type `Node*`) is successfully injected, `MemoryNode.tsx` properly generates the `<Handle>`, causing the missing Linked List arrows to seamlessly reappear.
