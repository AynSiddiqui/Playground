## Why

Uninitialized stack-allocated STL containers (like std::vector, std::priority_queue) contain stack garbage pointers on declaration, which GDB parses as having up to 1000 random garbage elements. This causes the memory visualizer to render massive, confusing lists of garbage. Additionally, users need a way to quickly center/fit the visualizer canvas viewport.

## What Changes

- **Debugger Integration**:
  - Filter out stack variables from snapshot locals if the execution is on or before their declaration line.
  - Implement GDB Python-level vector pointer validation to verify structural consistency (i.e. start <= finish <= end_of_storage) and detect uninitialized garbage data.
  - Traverse container adapters like priority queues through their underlying container `c` to apply these safety checks.
- **Memory Visualization UI**:
  - Add a "Center View" button in the canvas controls using React Flow's `fitView` to center and fit the canvas layout.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `debugger-integration`: Add safety validations for uninitialized stack/heap STL variables to prevent extracting garbage.
- `memory-visualization-ui`: Add viewport centering controls on the canvas panel.

## Impact

- `backend/scripts/stl_printers.py`: Enhances locals extraction, adapter extraction, and vector pretty-printing validation.
- `frontend/src/components/MemoryCanvas.tsx`: Exposes viewport fitView control.
- `frontend/src/index.css`: Styles for the new viewport centering buttons.
