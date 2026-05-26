## Context
Currently, the `MemoryCanvas.tsx` builder uses a `heapMap` to verify targets for raw fields, but bypasses validation for structural links (Linked Lists, Binary Trees). If a structural link points to an unknown address, the frontend forcibly pushes a new `memoryNode` to the canvas to compensate. This bypass is what causes deleted nodes and uninitialized garbage pointers to visually manifest.

## Goals
- Eradicate the forced-node-creation fallback for structural links.
- Create a unified `addressToNodeId` registry that tracks both heap allocations AND stack variables.
- Ensure all edges strictly target canonical Node IDs derived from the registry.

## Decisions
1. **Universal Registry**: We will replace `heapMap` with `addressToNodeId`. It will store mappings for both `heap` (e.g. `0x123` -> `heap-0x123`) and `stack` (e.g. `0x7fff` -> `stack-main-var-temp`).
2. **Strict Verification**: Inside the structural links loop, we will look up the node's address in `addressToNodeId`. If it returns undefined, the node is a phantom (deleted or uninitialized) and the loop will immediately `return` to skip it.
3. **Canonical Targeting**: All edge `target` properties will use the resolved ID from the registry instead of blindly appending `heap-` to the address. This perfectly supports stack-to-stack linked lists.
