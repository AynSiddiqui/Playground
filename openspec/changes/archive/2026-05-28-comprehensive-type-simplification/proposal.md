## Why

STL container types from GDB contain fully-qualified template parameters including default allocators, comparators, and ABI namespaces (`std::__cxx11::`). These add zero semantic value to the visualizer's audience (a person debugging C++) and actively degrade readability. The raw type strings are dozens of lines of noise when all anyone needs is `std::map<std::string, int>`.

## What Changes

1. **Shared type utility** — Extract `cleanType`, `isSTLType`, `getCleanSTLTypeName` into `frontend/src/utils/typeUtils.ts` as a single source of truth
2. **Comprehensive STL cleaning** — Extend `getCleanSTLTypeName` to handle all STL containers: `vector`, `list`, `deque`, `array`, `stack`, `queue`, `priority_queue`, `pair`
3. **Stack variable type display** — Apply cleaned type to stack variable nodes (currently show raw GDB output)
4. **Backend pre-cleaning** — Strip `std::__cxx11::` and replace `basic_string<...>` → `string` in Go before JSON serialization

## Capabilities

### New Capabilities
- *(none needed — this is a display refinement)*

### Modified Capabilities
- `memory-visualization-ui`: The STL Content Visibility requirement will be modified to specify that all displayed types are simplified (virtual allocators/comparators stripped, `basic_string` → `string`, `__cxx11` namespace removed)
- `debugger-integration`: The Memory Snapshot Extraction requirement will be modified to specify that type strings are pre-cleaned before JSON serialization (namespace stripping, allocator removal)

## Impact

- `frontend/src/utils/typeUtils.ts` — new shared module
- `frontend/src/components/MemoryCanvas.tsx` — import from typeUtils, add cleanType to stack nodes
- `frontend/src/components/MemoryNode.tsx` — import from typeUtils, show cleaned type
- `backend/internal/debugger/gdb.go` — extend `cleanType()` for namespace and allocator stripping
- No schema changes
