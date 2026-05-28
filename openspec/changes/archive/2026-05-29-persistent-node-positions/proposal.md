## Why

Currently, all node positions are recalculated using a Dagre layout on every debugger step (snapshot change). If a user aligns or customizes node positions on the canvas, their custom layout is lost immediately on the next execution step. Persisting manually placed coordinates across steps is essential for a fluid, non-disruptive debugging experience.

## What Changes

- Cache and reuse manual node coordinates across snapshots.
- Ensure newly allocated nodes get auto-positioned gracefully without resetting existing manual node placements.
- Provide a Reset Layout control button to clear cached coordinates and re-trigger auto-layout.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `memory-visualization-ui`: Add requirement for retaining user-configured node layouts and offering a layout reset mechanism.

## Impact

- `frontend/src/components/MemoryCanvas.tsx`: Update component to track manual drag coordinate offsets and merge them during node list reconstruction.
