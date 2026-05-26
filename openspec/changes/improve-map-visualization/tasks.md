## 1. Backend Fallback Sanitization

- [x] 1.1 Update `parseSTLOutput` in `backend/internal/debugger/gdb.go` to sanitize raw pretty printer lines by removing escaped newlines and brackets.

## 2. Stack Local STL Summarization

- [x] 2.1 Update `buildNodesAndEdges` in `frontend/src/components/MemoryCanvas.tsx` to precompute a lookup map of STL sizes from heap objects.
- [x] 2.2 In `MemoryCanvas.tsx` stack local iteration, if a local variable represents an STL container, look up its size and format `local.value` as `std::map (size=N)` (or similar summary representation).

## 3. Frontend STL Node Table Renderer

- [x] 3.1 Update `MemoryNode.tsx` to render a styled table with "Key" and "Value" columns for STL containers under `advancedData`.
- [x] 3.2 Add styling definitions for `stl-map-table` in `frontend/src/index.css` to manage layout bounds and text ellipsis.
