## Why

The current React Flow visualization suffers from critical layout collisions and missing node data. Specifically, Dagre's node dimensions are miscalculated, causing the `MAIN` stack block to overlap with adjacent edge routing lines and heap objects. Furthermore, while the visualizer renders the bounding boxes for structural nodes (like `LISTNODE`), it fails to populate their inner variables (`data`, `next`), rendering them as empty hollow boxes. Finally, the generic left-to-right layout creates confusing spatial hierarchies, particularly for binary trees which naturally demand a top-to-bottom pyramid structure.

## What Changes

1. **Intelligent Node Rendering**: Ensure that structural heap objects (Trees, Linked Lists) actively render their internal variables (e.g. `data`, `value`, `next`) inside their React Flow node bounding boxes.
2. **Dimension-Aware Auto-Layout**: Substantially increase the Dagre `width` and `height` boundary estimations for Stack (`MAIN`) nodes to explicitly prevent adjacent routing overlap and tangled pointer arrows.
3. **Dynamic Graph Directionality**: Implement adaptive DAG layouts where Binary Trees correctly render as Top-to-Bottom (`TB`) graphs, and default structures optionally use Left-to-Right (`LR`) with increased separation padding.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: The layout algorithm MUST calculate larger collision boundaries to protect the Stack frame from overlapping with edges. The DOM renderer MUST inject data fields back into advanced structural boxes so they are not hollow.

## Impact

- **Frontend**: The `MemoryCanvas.tsx` Dagre engine parameters will be optimized for padding. The node building loop will inject variables even for objects that originated from the `heapMap` root extraction to solve the missing variable bug.
