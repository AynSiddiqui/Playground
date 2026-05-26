## Why
The visualizer currently fails to properly render complex and interconnected data structures. Linked lists are incorrectly visually bound to the stack frame (`main.cpp`) rather than floating as independent heap structures. Pointer arrows (like `temp -> a`) lack directional clarity. Binary trees completely fail to parse and render. Standard Template Library (STL) containers are entirely unsupported or crash when mixed. Finally, nodes lack smooth graphical transitions between states.

## What Changes

1. **Backend Data Parsing & STL Support (GDB/Python)**:
- The Go backend MUST actively load and enforce GDB Python pretty-printers for all major STL containers (`std::vector`, `std::list`, `std::map`, `std::set`, `std::string`).
- When parsing complex objects, the backend must detect structural pointers explicitly: `left`/`right` for Binary Trees, and `next`/`prev` for Linked Lists.
- Every single variable, struct instance, and STL element MUST be assigned a globally unique `id` in the JSON payload based strictly on its memory address, ensuring multiple STLs can exist simultaneously without ID collisions.

2. **Frontend Canvas & Layout Separation (React Flow)**:
- Strictly separate the Stack and the Heap visually. The `main.cpp` stack frame should ONLY contain local variable names and primitive values. Pointers in the Stack must draw an edge pointing to a separate, floating node in the Heap space.
- Implement a hierarchical layout engine (e.g., Dagre.js) to automatically organize nodes in the Heap. Binary trees must render as top-down pyramids; Linked Lists must render as left-to-right chains.

3. **Edges and Transitions**:
- All pointer edges in React Flow MUST have explicit, visible directional arrowheads (e.g., `markerEnd: { type: MarkerType.Arrow }`).
- Implement smooth transitions. Because the backend now provides stable memory addresses as node IDs, React Flow nodes must use CSS transitions for positional changes and value updates, allowing elements to slide into place smoothly as the user steps through the code.

## Capabilities

### Modified Capabilities
- `debugger-integration`: Implement robust Python pretty-printers for all C++ STLs and explicit pointer parsing for trees/lists.
- `memory-visualization-ui`: Integrate Dagre.js for automatic hierarchical layouts. Separate Stack/Heap rendering logic. Add explicit arrow markers to edges and CSS transitions to node states.
- `websocket-protocol`: Ensure the payload strictly separates stack locals from heap allocations, providing stable memory addresses as unique identifiers.

## Impact
- **Backend**: The GDB wrapper must be heavily expanded to correctly format nested STLs and recursive structures into a flat array of nodes and edges for the frontend.
- **Frontend**: The React Flow canvas requires a complete layout refactor to utilize Dagre.js for positioning and explicit Edge components for pointers.
