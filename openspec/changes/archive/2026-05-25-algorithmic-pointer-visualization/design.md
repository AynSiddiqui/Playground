## Context
The previous topology design opted to merge duplicate pointers into badges to reduce SVG arrow overlap. However, Dagre is sophisticated enough to route multiple distinct source nodes to the same target node, provided the edges are clearly distinguished. By utilizing React Flow's `animated: true` edge property, we can achieve visual clarity without merging the data.

## Goals
- Represent every stack pointer as a physical, independent node on the canvas.
- Draw explicitly animated edges from stack pointers to their heap targets.
- Remove the obsolete badging logic from both the graph builder and the node component.

## Decisions
1. **Unconditional Stack Nodes**: In `MemoryCanvas.tsx::buildNodesAndEdges`, we will remove the `if-else` that intercepts stack variables and pushes them to `pointerLabels`. All locals will trigger a `nodes.push()`.
2. **Dedicated Edge Injection**: Immediately after pushing the stack node, if it points to a valid `heapMap` address, we will inject a new edge into `edgeMap` (e.g., `id: edge-stack-var-${frameId}-${local.name}`).
3. **Styling**: Stack pointer edges will use a distinct color (e.g., `#ec4899` pink) to differentiate them from structural data links (like `next` or `left`), allowing users to instantly distinguish variables from structural architecture.
