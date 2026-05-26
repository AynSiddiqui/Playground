## 1. Eliminate Badge Interception
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx::buildNodesAndEdges`, remove the `pointerLabels` Map declaration.
- [x] 1.2 Remove the `if-else` logic inside `(snapshot.stack || []).forEach` that pushes to `pointerLabels`.
- [x] 1.3 Unconditionally push the `nodes.push({ ... category: 'variable' })` for every `local` variable.
- [x] 1.4 Remove the injection of `labels: pointerLabels.get(obj.address)` from the `heap` nodes mapping.

## 2. Animated Stack Edges
- [x] 2.1 Inside the `snapshot.stack` loop, immediately after pushing the `variable` node, add a check: `if (targetAddr && targetAddr !== '0x0' && targetAddr !== '0' && heapMap.has(targetAddr))`.
- [x] 2.2 Inside the check, create an edge connecting the stack node to the heap node. Use `edgeMap.set(edgeObj.id, edgeObj)`.
- [x] 2.3 Style the edge with `animated: true` and a highly visible pink stroke (`#ec4899`) to represent active stack tracking.

## 3. UI Cleanup
- [x] 3.1 In `frontend/src/components/MemoryNode.tsx`, remove all DOM rendering logic related to `labels` and `.memory-node__label-badge`.
