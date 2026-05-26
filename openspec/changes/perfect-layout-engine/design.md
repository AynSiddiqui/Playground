## Context
React Flow connects edges precisely via the defined `<Handle>` components. However, Dagre calculates positions based on purely provided bounding boxes. Currently, the Stack Frame bounding box is severely underestimated, causing edges and adjacent heap nodes to route straight through it. Concurrently, the parsed Python backend objects for Trees and Lists do not map their inner variables to the frontend node, leaving them completely empty.

## Goals / Non-Goals
**Goals:**
- Fix the React Flow layout collisions by safely padding the Dagre graph parameters.
- Dynamically select Dagre's `rankdir: 'TB'` (Top-to-Bottom) specifically when the heap contains a Binary Tree.
- Ensure all structural data (e.g., `data = 159`) is physically visible inside its respective `MemoryNode` box.

**Non-Goals:**
- We are not restructuring the backend JSON. We simply must utilize the data correctly on the frontend mapping loop.

## Decisions
- **Adaptive Layout Engine**: Inside `getLayoutedElements`, if any node is designated as `BINARY_TREE`, switch the entire graph routing layout to `TB`.
- **Bounding Box Correction**: Hardcode the `MAIN` stack frame `width` to `350` and `height` to at least `250` in the Dagre loop to force React Flow to route edges entirely around the block, preventing the tangling overlap.
- **Node Variable Backfilling**: When iterating `obj.structuralLinks.nodes` in `MemoryCanvas.tsx`, if the node was already registered into `nodes[]`, explicitly find the node and backfill its `variables: subVariables` so it isn't rendered as a hollow box.
