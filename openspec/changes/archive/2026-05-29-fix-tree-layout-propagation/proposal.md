## Why

Manually moving a parent node in binary tree or linked list structures isolates it from its children, disrupting the visual hierarchy. When new child nodes spawn, they layout relative to default auto-positions rather than the parent's current absolute layout positions, causing canvas jumps.

## What Changes

- **Memory Visualization UI**:
  - Refactor graph layout calculations to build a child adjacency map of structural edges.
  - Implement subtree layout delta propagation from manually positioned parents to their unpositioned descendants.
  - Eliminate the legacy `isNew` spawn offsets block in favor of automatic ancestor delta propagation.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `memory-visualization-ui`: Refine parent-relative node spawning and layout position persistence requirements to preserve hierarchical subtrees as cohesive units.

## Impact

- `frontend/src/utils/graphBuilder.ts`: Modifies `getLayoutedElements` to compute deltas and propagate them recursively down structural subtrees.
