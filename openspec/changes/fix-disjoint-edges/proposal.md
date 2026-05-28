## Why

Currently, connection lines (edges) are disjoint from their source handles and snap to node borders or corners. This disconnect happens because the handle IDs and edge sourceHandle properties are complex concatenated strings (e.g. `${nodeId}-${local.name}`). If there is any formatting drift or timing mismatch, React Flow fails to match the handle ID, falling back to basic node border connections. Simplifying handle IDs to use only the row-level variable or field names (which are unique within a node) makes edge connection matching robust.

## What Changes

- Simplify `<Handle>` component ID attributes in `MemoryNode.tsx` to use only the variable/field/link key name (e.g. `next`, `left`, `right`).
- Update edge generator logic in `MemoryCanvas.tsx` to set `sourceHandle` properties matching these simplified, row-level handle IDs.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `memory-visualization-ui`: Add requirement that connection edges must connect cleanly and directly to their designated row-level handles.

## Impact

- `frontend/src/components/MemoryCanvas.tsx`: Update edge `sourceHandle` configurations.
- `frontend/src/components/MemoryNode.tsx`: Update `<Handle>` components to render clean, simplified IDs.
