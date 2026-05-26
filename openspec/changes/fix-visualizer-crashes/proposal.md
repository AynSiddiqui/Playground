## Why

The debugger is currently failing to render due to two critical crashes. First, the GDB backend is choking on memory addresses that include debug symbols (e.g. `0x7d77370d0d92 <malloc+514>`), causing `dereferencePointer` casting to fail. When this fails, the backend returns an incomplete JSON snapshot, triggering a frontend `null.forEach()` crash because the `MemoryCanvas.tsx` does not fallback to empty arrays.

Additionally, the visual grouping of stack pointers versus heap objects remains confusing. The user explicitly requested that Linked List nodes should not be entangled with the `main.cpp` stack block; instead, stack pointers must just be distinct elements that point to a completely separate box representing the Heap node.

## What Changes

1. **Backend Address Sanitization (GDB)**:
- Intercept the `local.Address` in `extractHeapObjects` and aggressively strip any trailing symbols (e.g. `<malloc+514>`) so GDB evaluates clean hex strings.
2. **Frontend Null Safety**:
- Add `|| []` fallbacks in `MemoryCanvas.tsx` for `snapshot.heap` and `snapshot.stack` to prevent UI hard crashes on malformed data.
3. **Visual Disentanglement (Stack vs Heap)**:
- Ensure the React Flow nodes representing `stack` frame variables do NOT deeply embed the linked list nodes. 
- Map stack pointers to strictly draw an edge to the detached Heap Object box. The Heap box will cleanly render only its physical struct values and its absolute memory location.

## Capabilities

### Modified Capabilities
- `debugger-integration`: Add strict address string sanitization before invoking `-data-evaluate-expression`.
- `memory-visualization-ui`: Enforce rigid separation of stack nodes vs heap nodes, ensuring pointers draw edges rather than embedding data. Add protective null-checks to the React Flow build pipeline.

## Impact
- **Backend**: Small regex/split patch in `gdb.go` to sanitize pointers.
- **Frontend**: Minor null-checking in `MemoryCanvas.tsx`, and a review of the React Flow node mappings to guarantee stack boxes and heap boxes remain visually isolated.
