## Why

The current memory visualizer layout is restricted by a massive, monolithic `MAIN` stack frame box. This monolithic box causes several severe UX issues:
1. It artificially clumps all local variables together, causing their outgoing pointer arrows to cross over each other and overlap, resulting in a tangled mess.
2. It violates the user's mental model of independent variables moving and pointing to data structures.

Additionally:
- **Uninitialized Pointers**: Variables containing garbage memory addresses (like `<malloc+514>`) are generating disconnected, bogus pointer edges. 
- **Hollow Nodes**: Linked List and Tree nodes are still rendering as empty boxes without their internal `data` fields.
- **STL Invisibility**: Standard Template Library (STL) containers (vectors, maps, sets) are failing to display their internal elements visually on the canvas.

## What Changes

1. **Abolish the Monolithic Stack Frame**: 
- Completely remove the `MAIN` box. 
- Explode local stack variables into individual, independent `<ReactFlow>` floating nodes (e.g., a tiny node just for `a`, another tiny node for `b`). This allows the layout engine to place the pointer variables exactly next to the heap allocations they reference, eliminating crossed/overlapping arrows entirely!

2. **Garbage Pointer Filtering**:
- Suppress edge generation for uninitialized pointers that do not strictly resolve to a valid heap allocation tracked by the backend.

3. **Data Hydration & STL Rendering**:
- Actively inject the `value` fields (like `data`) into the structural nodes so they are never hollow.
- Overhaul the `MemoryNode.tsx` STL rendering block to ensure arrays, vectors, maps, queues, and stacks explicitly list their indices and values in a clean grid/list format.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: Radically change the React Flow node generation. The single stack node is deleted and replaced by N individual variable nodes. Edges are drawn strictly from variable nodes to heap nodes.
- `debugger-integration`: Add strict filtering to ignore uninitialized or garbage pointer addresses.

## Impact
- **Frontend**: `MemoryCanvas.tsx` will map `frame.locals` into standalone nodes instead of a single grouped node. Dagre layout will become exponentially cleaner. STL element rendering inside `MemoryNode.tsx` will be repaired.
