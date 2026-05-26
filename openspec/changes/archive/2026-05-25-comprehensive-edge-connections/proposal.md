## Why

The memory visualizer is failing to draw arrows for Linked Lists and Binary Trees because of two critical data routing mismatches between the Python backend (`gdb.go` / `stl_printers.py`) and the React frontend (`MemoryCanvas.tsx`):

1. **The Heap Data Mismatch**: When the backend encounters a complex heap structure (like a Linked List), it correctly parses the entire interconnected registry. However, it assigns this registry to `obj.advancedData` in the JSON snapshot. The React graph builder strictly looks for it in `obj.structuralLinks` instead, causing it to completely ignore the data and fail to draw the structural arrows!
2. **The Stack Allocation Blackhole**: If a user creates a Linked List directly on the stack (e.g., `ListNode a; ListNode b; a.next = &b;`), the backend attaches the parsed structural registry to the local variable (`local.structuralLinks`). But `MemoryCanvas.tsx` completely ignores `structuralLinks` for stack variables, trapping them as primitive single-row boxes without any arrows.

## What Changes

1. **Frontend Data Routing (Heap)**:
- In `MemoryCanvas.tsx`, we will update the structural links check to seamlessly fallback to `advancedData`: `const structuralLinks = obj.structuralLinks || (obj.advancedData?.type === 'LINKED_LIST' || obj.advancedData?.type === 'BINARY_TREE' ? obj.advancedData : null);`. 
- This will instantly unlock the beautifully deduplicated edge-building logic we implemented previously, causing the arrows to vividly appear for all heap-based linked lists.

2. **Frontend Data Routing (Stack)**:
- We will refactor the `(snapshot.stack || []).forEach` loop in `MemoryCanvas.tsx` to process `local.structuralLinks` and `local.fields` with the exact same robust edge-building logic used for heap objects.
- If a stack variable has a structural registry, it will draw perfectly synchronized SVG arrows to the next node (whether on the stack or the heap).

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: The graph builder must dynamically map both `advancedData` (from the heap) and `structuralLinks` (from the stack) into React Flow edges to guarantee absolute pointer connectivity.

## Impact
- **Frontend**: Guaranteed arrow connections for all Linked Lists and Binary Trees, regardless of whether they are allocated dynamically via `new` (Heap) or statically as standard variables (Stack).
