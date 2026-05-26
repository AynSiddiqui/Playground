## ADDED Requirements

### Requirement: Independent Disjoint Heap Nodes
The visualization SHALL render every struct, node, or object allocated on the heap as an independent, movable node within the canvas, rather than recursively embedding them inside a single parent node.

#### Scenario: Dragging a linked list node
- **WHEN** the backend returns a linked list with 3 nodes
- **THEN** the frontend plots 3 distinct `MemoryNode` components connected by SVG edges, which can be dragged around independently by the user.

### Requirement: Editor Snippets Library
The Code Editor pane SHALL provide a dropdown menu of predefined C++ boilerplates to facilitate rapid testing of complex data structures.

#### Scenario: User wants to test a Binary Tree
- **WHEN** the user selects "Binary Tree" from the snippets dropdown
- **THEN** the editor's contents are replaced with a working `struct TreeNode` definition and a `main()` function that allocates a small tree.
