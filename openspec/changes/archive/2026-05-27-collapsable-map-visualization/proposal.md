## Why

Currently, visualizer nodes for C++ maps and other STL containers suffer from major UX layout issues:
1. GDB returns extremely long nested template type signatures (containing standard allocators and trait classes) which stretch node headers horizontally and break the React Flow canvas diagram layout.
2. Large STL containers take up excessive vertical space on the canvas, leading to visual clutter.
3. The table elements do not have visual toggle control to collapse/expand their entries, and stepping to a new execution line currently resets any node state.

## What Changes

1. **Clean STL Type Headers**: Implement template type parsing in `MemoryCanvas.tsx` to display concise STL type signatures in node headers (e.g., `std::map<std::string, int>` instead of full raw GDB strings), while preserving the full type signature in hover tooltips.
2. **Collapsible Nodes**: Add a collapsible toggle arrow (`▼` / `▶`) in the node headers of STL containers inside `MemoryNode.tsx` to allow expanding/collapsing the container element tables.
3. **State Persistence**: Store the set of collapsed node IDs in the state of `MemoryCanvas.tsx` so that expanding/collapsing choice is maintained dynamically as the user travels through the debugging timeline.
4. **Key/Value Table Rendering**: Render map and set elements in a structured table layout with `Key` and `Value` column headers.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `memory-visualization-ui`: The user interface is modified to support compact collapsable STL container nodes, reactive header type cleaning, and persistent collapse state tracking.

## Impact

- **Frontend**:
  - `frontend/src/components/MemoryCanvas.tsx` (Precompute type parser, handle collapse toggle callback, track collapsed node state)
  - `frontend/src/components/MemoryNode.tsx` (Render collapsible header toggles and map key/value table)
  - `frontend/src/index.css` (Add styling for map tables, headers, and collapse toggle animations)
