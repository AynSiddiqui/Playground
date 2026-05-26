## MODIFIED Requirements

### Requirement: Anti-Collision Auto-Layout
The memory canvas UI SHALL route all pointer edges strictly around other nodes. Nodes must never be positioned such that incoming or outgoing structural arrows clip or overlap with unrelated stack frames or boxes.

#### Scenario: Preventing stack collision
- **WHEN** multiple pointers extend from the `MAIN` stack frame
- **THEN** the layout engine enforces an inflated boundary around `MAIN`, forcing edges to explicitly navigate outward before routing to their targets.

### Requirement: Inner Value Visibility
All structurally linked heap elements (Tree Nodes, Linked List Nodes) SHALL visually render their internal variables. A node must never be displayed as a hollow box containing only an address.

#### Scenario: Displaying list values
- **WHEN** the debugger evaluates a linked list node
- **THEN** the React Flow node clearly lists `data: <value>` and any explicit `<Handle>` endpoints inside the node body.
