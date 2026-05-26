## Why

The current single-pass graph generation suffers from two critical flaws that cause arrows and inner values to vanish:
1. **The Order-of-Execution Drop**: If Node A points to Node B, but the loop processes Node A first, Node B hasn't been dynamically generated yet. The registry lookup for Node B fails, and the arrow from A to B is permanently aborted. This guarantees that all forward-pointing arrows in Linked Lists drop, and *all* child arrows in Binary Trees drop.
2. **The Missing Inner Values**: When the arrow generation aborts, it accidentally aborts *before* pushing the pointer field (e.g. `next`, `left`) to the node's inner `variables` array. This causes the pointer field to physically disappear from the node box, making it look like the data was lost.

## What Changes

1. **Two-Pass Architecture**: We will split the structural parsing into two explicit passes. Pass 1 will pre-register and dynamically create all missing nodes into the `addressToNodeId` registry. Pass 2 will then iterate again to safely draw the edges, mathematically guaranteeing that the targets exist in the registry.
2. **Data Preservation**: We will shift the `subVariables.push` logic *above* the edge validation check. Even if an arrow drops (e.g., it points to a deleted dangling memory address), the pointer field will still be safely injected into the node box, ensuring the user always sees their data.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: Guarantees perfect edge generation and data preservation by utilizing a robust two-pass node creation and edge drawing strategy.

## Impact
- **Frontend**: All missing arrows in Linked Lists and Binary Trees will immediately reappear. Pointers to deleted nodes will correctly display their fields without drawing ghost arrows.
