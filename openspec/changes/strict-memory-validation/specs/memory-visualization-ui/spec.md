## MODIFIED Requirements

### Requirement: Strict Lifecyle Rendering
The visualizer SHALL ONLY render memory nodes that strictly exist in the backend state snapshot. 
- **WHEN** a node is deleted (e.g. `delete ptr;`), the UI SHALL completely remove the node from the canvas, refusing to render it even if dangling pointers reference it.
- **WHEN** a pointer is uninitialized (holding garbage data), the UI SHALL NOT render phantom nodes at the garbage address.
- **WHEN** structural links target a valid address (heap or stack), the UI SHALL route the edge to the canonical Node ID of that allocation.
