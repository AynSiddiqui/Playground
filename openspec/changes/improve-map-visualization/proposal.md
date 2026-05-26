## Why
Currently, `std::map` and `std::unordered_map` render poorly in the visualizer:
1. Stack local variable rows display GDB's raw internal tree structures (e.g., `{_M_t = {_M_impl = ...}}`), stretching the nodes and cluttering the UI.
2. The heap-dereferenced STL nodes do not display key-value elements at all if `advancedData` is present, because `MemoryNode.tsx` lacks a renderer for `STL_CONTAINER` types inside `advancedData`.
3. If `advancedData` is absent, the fallback GDB pretty-printed output displays as a single raw string containing escaped newlines (`\n`) and braces.

## What Changes
1. **Stack Variable Summary**: In `MemoryCanvas.tsx`, detect stack locals representing STL containers/arrays and replace their raw GDB string value with a clean summary format: `std::map (size=N)` or `std::vector (size=N)` by referencing the elements count of their mapped heap node.
2. **Advanced STL Renderer**: Implement a structured table layout in `MemoryNode.tsx` for `advancedData` of type `STL_CONTAINER`, displaying a table header with `Key` and `Value` columns.
3. **Clean Fallback Parser**: Update `parseSTLOutput` in `gdb.go` to sanitize raw pretty-printer output by replacing newline escapes and stripping metadata/braces.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `memory-visualization-ui`: The user interface is enhanced to cleanly format stack-allocated STL container summaries and render key-value maps inside structured tables on the canvas.

## Impact
- **Frontend**:
  - `frontend/src/components/MemoryCanvas.tsx` (Summarize STL stack local variable values)
  - `frontend/src/components/MemoryNode.tsx` (Render key-value tables for STL maps/sets)
- **Backend**:
  - `backend/internal/debugger/gdb.go` (Sanitize pretty-printer strings in `parseSTLOutput`)
