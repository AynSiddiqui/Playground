## MODIFIED Requirements

### Requirement: Unified React Flow Canvas
The UI SHALL render a singular, unified `<ReactFlow>` canvas containing all memory data. The canvas must NOT be split into disconnected HTML blocks or distinct generic panels that prohibit inter-node SVG connections.

#### Scenario: Visualizing a stack pointer to heap
- **WHEN** a local variable in the stack frame points to a heap allocation
- **THEN** both the stack frame and the heap object appear on the same draggable canvas, with a distinct SVG arrow drawing from the local variable directly to the heap node.

### Requirement: Explicit Structural Connections
The UI SHALL render explicit edge lines for all identified structural connections (such as Linked List `next` pointers, or Tree `left`/`right` pointers) between objects mapped on the unified canvas.

#### Scenario: Stepping through a Linked List
- **WHEN** the debugger evaluates a linked list of 3 nodes
- **THEN** the React Flow canvas displays 3 distinct heap nodes with `next` arrows drawn cleanly between them, alongside the stack frame pointing to the `head`.
