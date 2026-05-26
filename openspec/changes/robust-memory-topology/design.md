## Context
Pointers extracted by the Python backend export their *target* addresses within the `address` field. Previously, the React frontend naively mapped `local.address -> nodeId`. For pointers, this meant overwriting the heap node's canonical registry entry with the stack variable's ID, causing edges targeting the heap to hit the stack variable instead.

## Goals
- Fix the stack variable registry mapping.
- Fix duplicate structural edge rendering.
- Unify Handle generation in `MemoryNode.tsx`.

## Decisions
1. **Pointer Filtering**: We will compute `const isPointer = local.type && local.type.includes('*');`. The registry mapping `addressToNodeId.set` will ONLY execute if `!isPointer`, ensuring pointers never overwrite target identities.
2. **Set Tracking**: A `Set<string>` named `processedStructuralLinks` will be instantiated at the top of `buildNodesAndEdges` and checked before rendering any structural edge block.
3. **Component Simplification**: The `advancedData` block in `MemoryNode.tsx` will no longer generate its own Handles. It will rely entirely on the main `variables` mapper.
