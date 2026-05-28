## Why

When new memory objects are allocated (such as child nodes in a binary tree or nodes in a linked list), they currently spawn at coordinate (0, 0) or default positions calculated independently by the auto-layout engine. This causes layout jumping and disorienting transitions during step-by-step debugging. Spawning new nodes relative to their parent's current position (e.g., child nodes directly below tree parents) creates a natural structural flow.

## What Changes

- Scan connections to detect when a newly introduced node is linked to an existing parent node.
- Calculate and apply parent-relative spawn coordinates (below the parent for tree node left/right branches, and to the right for linked list next links) as their initial position.
- Prevent layout shifts by anchoring new nodes next to their logical reference parents.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `memory-visualization-ui`: Add requirement for parent-relative initial coordinate seeding for newly rendered nodes.

## Impact

- `frontend/src/components/MemoryCanvas.tsx`: Update element positioning logic to detect structural links and set parent-relative baseline positions.
