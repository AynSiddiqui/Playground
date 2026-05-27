## Why

Currently, C++ STL map values on the visualization canvas are right-aligned, causing misalignment with left-aligned headers. Additionally, C++ reference variables (`&` references) on the stack do not draw pointer edges (arrows) to the heap or stack objects they reference, even though they share the same memory address.

## What Changes

- Modify map cell CSS alignment so that map values are left-aligned or centered, aligning properly with their headers.
- Extend frontend edge-building logic to recognize C++ reference variables (types containing `&`) as pointer-like links, resolving their target addresses to draw connecting SVG arrows to the referenced stack or heap objects.
- Add `std::pair` to the list of recognized STL types on the frontend to allow proper mapping of pair variables.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `memory-visualization-ui`: Map values are left-aligned to align with the column headers. Edge rendering is extended to reference types (`&`) so that variables sharing memory addresses with stack or heap objects successfully draw connecting arrows on the canvas.

## Impact

- **Affected Code**: `frontend/src/components/MemoryCanvas.tsx`, `frontend/src/index.css`.
- **Systems**: Memory visualization canvas rendering.
