## Context
The layout overlapping is mathematically impossible to solve cleanly when dozens of variables are trapped inside a single `MAIN` stack box, because their outgoing edges are forced to emit from the same physical coordinate block and cross each other. By deleting the stack block and rendering variables as tiny individual nodes, Dagre's `rankdir` layout will naturally place each variable directly adjacent to the heap node it points to, creating a flawless 1:1 mapped graph.

## Goals / Non-Goals
**Goals:**
- Explode `frame.locals` into standalone `<ReactFlow>` nodes.
- Discard the `MAIN` frame grouping container completely.
- Filter out garbage pointer generation.
- Ensure structural variables (`data`, `next`) and STL `elements` are hydrated into the frontend React nodes.

**Non-Goals:**
- We are not discarding Dagre. Dagre is perfect for this once the monolithic block is removed.

## Decisions
- **Variable Node Type**: We will map each local variable as an independent node of type `memoryNode` with `category: 'variable'`. It will be a tiny box containing just the variable name, type, and an output handle.
- **Garbage Address Filtering**: Edges will ONLY be drawn if `heapMap.has(targetAddr)` is true. If a pointer points to `0x7bd358...` (garbage/uninitialized) which is not a tracked heap allocation, no edge is drawn!
- **Data Hydration**: During `MemoryCanvas.tsx` loop, we will look up the existing node `heap-${addr}` and explicitly assign `node.data.variables = subVariables`.
- **STL Rendering**: `MemoryNode.tsx` will be updated to beautifully render `elements` arrays (for Vectors/Sets/Queues) and `key/value` pairs (for Maps) natively inside the box.
