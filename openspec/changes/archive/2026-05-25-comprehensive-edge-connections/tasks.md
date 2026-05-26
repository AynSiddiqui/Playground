## 1. Heap Data Bridging
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx::buildNodesAndEdges`, locate the `if (obj.structuralLinks)` check inside the `snapshot.heap` iteration block.
- [x] 1.2 Modify the variable extraction to gracefully fallback: `const rawLinks = obj.structuralLinks || obj.advancedData;`. Check if `rawLinks` has a `type` of `LINKED_LIST` or `BINARY_TREE` before processing it to ensure it is actually a structural registry.

## 2. Stack Variable Connectivity
- [x] 2.1 In `MemoryCanvas.tsx`, locate the `snapshot.stack` iteration block where stack nodes are pushed to the `nodes` array.
- [x] 2.2 If `local.structuralLinks` or `local.fields` is populated, execute the edge-building algorithms so stack nodes can spawn connecting arrows to their targets. (Ensure they use `edgeMap.set` to prevent duplicates!).
