## Why

When C++ code containing standard vectors (1D or 2D) or arrays is run, the memory visualizer fails to render elements properly or displays a "No memory data to display" error. This is caused by missing renderers for 1D arrays/vectors, broken 2D matrix layout mapping, disconnected stack-allocated STL variables, and a layout orientation check bug for binary trees.

## What Changes

- **1D/2D Visualizations**: Implement dedicated, responsive element renderers for 1D arrays (`ARRAY_1D`) and 2D arrays/matrices (`MATRIX_2D`) in `MemoryNode.tsx`.
- **Stack-Allocated Complex Linkages**: Update `MemoryCanvas.tsx` to connect stack-allocated STL containers and arrays to their corresponding memory representation nodes on the canvas.
- **Dagre Layout Orientation Fix**: Correct the layout calculation check in `MemoryCanvas.tsx` so that binary trees are aligned vertically (`TB`) instead of horizontally (`LR`).
- **No Backend Impact**: The Go backend and GDB Python wrappers remain untouched as they already output correct data.

## Capabilities

### New Capabilities

- *(none — this refines existing capability)*

### Modified Capabilities

- `memory-visualization-ui`: The memory visualization user interface is enhanced to render 1D vectors/arrays and 2D matrices, draw edges for stack-allocated STL containers, and support proper layout rules.

## Impact

- **Frontend Components**:
  - `frontend/src/components/MemoryCanvas.tsx` (layout logic and edge generator)
  - `frontend/src/components/MemoryNode.tsx` (node elements visualizer)
- **APIs and Backend**: No impact.
