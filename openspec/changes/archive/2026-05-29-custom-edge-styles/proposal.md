## Why

Different types of memory structures benefit from different edge rendering styles (e.g., straight lines for direct stack-to-heap pointers, grid lines for complex pointer grids, and curved lines for nested tree structures). Providing a user-selectable style option improves visual clarity and reduces canvas clutter.

## What Changes

- Add a UI selector inside the memory canvas to toggle between three connection styles: Grid, Straight, and Curved.
- Persist the selected connection style in the user's browser local storage.
- Update the SVG path generation dynamically to render the chosen edge type (default Bezier, straight, or smoothstep).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `memory-visualization-ui`: Add requirement for configurable edge routing styles (Grid, Straight, Curved), persistent preference, and floating canvas control overlay.

## Impact

- `frontend/src/components/MemoryCanvas.tsx`: Update edge creation logic and render selector UI.
- `frontend/src/index.css`: Add styling for selector UI components.
