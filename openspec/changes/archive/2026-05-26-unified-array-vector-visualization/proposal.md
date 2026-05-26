## Why

Standard vectors (1D and 2D) and raw arrays (1D and 2D) fail to render properly or show a "No memory data to display" error in the visualizer UI. This is due to inconsistent serialization format for 1D raw arrays, a crash in GDB's Python matrix extractor on raw 2D arrays, frontend render gates requiring `isStl` for 1D arrays, disconnected stack-allocated STL/array pointer edges, and a layout check causing binary trees to orient horizontally.

## What Changes

- **Backend (Python)**:
  - Update `_extract_array` in `stl_printers.py` to format elements of raw arrays as `{"index": i, "value": val}`.
  - Implement raw 2D array row-major fallback extraction in `_extract_matrix` in `stl_printers.py`.
- **Frontend**:
  - Remove the `isStl` requirement from the `ARRAY_1D` block in `MemoryNode.tsx` so raw arrays can render.
  - Add pointer edge linking in `MemoryCanvas.tsx` for stack-allocated STL containers and arrays to their memory representation.
  - Correct the layout check in `MemoryCanvas.tsx` to inspect `type === 'BINARY_TREE'` for proper vertical tree layout.

## Capabilities

### New Capabilities

- *(none — this refines existing capability)*

### Modified Capabilities

- `memory-visualization-ui`: The visualizer UI is modified to display 1D and 2D arrays, 1D and 2D vectors, and to correctly link stack-allocated complex types and layout binary trees vertically.

## Impact

- **Backend Components**:
  - `backend/scripts/stl_printers.py` (GDB python helper)
- **Frontend Components**:
  - `frontend/src/components/MemoryCanvas.tsx` (state mapping and layout engine)
  - `frontend/src/components/MemoryNode.tsx` (elements render layout)
- **APIs and Execution Sandbox**: No impact.
