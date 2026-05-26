## 1. Stack Frame Abolition
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx`, delete the logic that pushes a monolithic `stack-${frame.frameId}` node.
- [x] 1.2 Instead, iterate over `frame.locals`. For each variable, push an independent node (e.g. `stack-var-${local.name}`) with a new category label (e.g. `'variable'`).
- [x] 1.3 Ensure the independent variable node generates an `<Edge>` connecting directly to `heap-${targetAddr}`, but ONLY if `heapMap.has(targetAddr)` is true (which naturally filters out uninitialized/garbage pointers).

## 2. Structural & STL Hydration
- [x] 2.1 In `MemoryCanvas.tsx`, when processing `obj.structuralLinks.nodes`, locate the previously created `heap-${addr}` node in the `nodes` array and inject `subVariables` into its `data.variables` property so the boxes are no longer empty.
- [x] 2.2 Verify `MemoryNode.tsx` properly supports rendering the `category === 'variable'` tiny style, and ensure the STL `elements` iteration correctly displays arrays, vectors, pairs, maps, sets, queues, and stacks.

## 3. Layout Optimization
- [x] 3.1 In `MemoryCanvas.tsx`, update `getLayoutedElements` to dynamically use `rankdir: 'TB'` if the graph contains any `BINARY_TREE` structures, otherwise use `LR` to perfectly align the newly independent pointer variables with their targets.
