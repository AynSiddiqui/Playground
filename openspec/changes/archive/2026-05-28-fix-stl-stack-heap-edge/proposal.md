## Why

Stack-allocated `std::map` and `std::pair` variables appear as disconnected floating blocks in the visualizer. The edge from the stack variable to its heap representation is never drawn. Two root causes:

1. **Backend**: `dereferencePointer` at `gdb.go:373` sends `-data-evaluate-expression "*(std::map<...full_template...>*)0x7fff..."`. GDB's expression parser chokes on commas nested inside `<>` in the template type string. `sendCommand` returns error, `dereferencePointer` returns nil, no `HeapObject` is created.

2. **Frontend**: Even when a `HeapObject` is created at the same address, `MemoryNode.tsx:82-88` only renders `Handle` components for pointer types (`v.type.includes('*')`). STL container types don't contain `*`, so the edge's `sourceHandle` has no matching DOM element and React Flow silently drops the edge.

## What Changes

1. Go backend: Add a fallback in `extractHeapObjects()` for STL types when `dereferencePointer` returns nil — create a `HeapObject` with the known address and type, then populate it via the `adv-dump` Python CLI command (which uses GDB's Python API and handles complex types correctly)
2. Frontend `MemoryNode.tsx`: Add a `Handle` component for STL-type variables on stack nodes so the edge has a visual anchor point
3. Frontend `MemoryCanvas.tsx`: Use a distinct edge style (amber color) for STL stack→heap connections to make them visually distinguishable from raw pointer edges

## Capabilities

### New Capabilities
- *(none needed — this is a bug fix)*

### Modified Capabilities
- `debugger-integration`: The Memory Snapshot Extraction requirement will be modified to specify that stack-allocated STL containers produce HeapObjects even when GDB expression evaluation fails (fallback via Python pretty printers)
- `memory-visualization-ui`: The Visual Edge Rendering requirement will be modified to specify that STL stack→heap connections render a `Handle` anchor and use distinct visual styling

## Impact

- `backend/internal/debugger/gdb.go`: Add ~35 lines in `extractHeapObjects()` after `dereferencePointer` nil check *(already done)*
- `frontend/src/components/MemoryNode.tsx`: Add Handle rendering for non-pointer STL variables on stack nodes
- `frontend/src/components/MemoryCanvas.tsx`: Add distinct edge style for STL stack→heap connections
- No changes to types or schema
