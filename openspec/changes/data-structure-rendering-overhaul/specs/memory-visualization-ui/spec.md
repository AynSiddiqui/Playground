## ADDED Requirements

### Requirement: Hierarchical Canvas Layout
The UI SHALL use the Dagre layout engine to position all nodes in the React Flow canvas hierarchically. Stack nodes must sit logically apart from Heap nodes, and structures like Binary Trees must render in a top-down pyramid shape.

#### Scenario: Laying out a binary tree
- **WHEN** the frontend receives the nodes and edges of a binary tree
- **THEN** Dagre automatically computes the `x` and `y` positions so the root is at the top, and children branch outward below it.

### Requirement: CSS Transitions for Nodes
The UI SHALL apply CSS transition styling to React Flow `MemoryNode` components so they animate smoothly between steps when their values or positions change.

#### Scenario: Stepping over a value update
- **WHEN** a variable's value changes from 1 to 2
- **THEN** the UI smoothly updates the value or location without instantly snapping or flashing the entire canvas.

### Requirement: Edge Arrowheads
The UI SHALL render explicit arrowheads on all pointer edges to clearly convey directionality (e.g. from pointer to pointee).

#### Scenario: Visualizing a pointer
- **WHEN** a node has an edge connecting to another node
- **THEN** the edge renders an SVG arrowhead pointing strictly to the target node.
