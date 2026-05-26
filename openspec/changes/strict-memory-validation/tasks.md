## 1. Unified Address Registry
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx`, rename `heapMap` to `addressToNodeId`.
- [x] 1.2 In the `snapshot.heap` iteration, set `addressToNodeId.set(obj.address, 'heap-' + obj.address)`.
- [x] 1.3 In the `snapshot.stack` iteration, inside the local loop, add: `if (local.address && local.address !== '0x0') addressToNodeId.set(local.address, nodeId);` so stack variables are registered.

## 2. Enforce Strict Node Validation
- [x] 2.1 Inside the `structuralLinks` logic (both in the heap loop and stack loop), replace the forced node creation block (`if (!heapMap.has(addr)) { nodes.push(...) }`) with strict validation: `const subNodeId = addressToNodeId.get(addr); if (!subNodeId) return; // Skip phantom node`.
- [x] 2.2 For all edge creations inside the structural links logic, verify the target: `const targetNodeId = addressToNodeId.get(nodeLinks.next); if (targetNodeId) { ... create edge targeting targetNodeId ... }`. Apply this securely to `next`, `prev`, `left`, and `right`.
- [x] 2.3 For basic fields and stack variables, replace all `heapMap.has(targetAddr)` checks with `addressToNodeId.has(targetAddr)` and set the edge target to `addressToNodeId.get(targetAddr)`.
