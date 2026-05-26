## MODIFIED Requirements

### Requirement: Guaranteed Edge Rendering
The UI SHALL render SVG edges between Memory Nodes for all recognized structural relationships (Linked Lists, Binary Trees), using `structuralLinks` as the canonical data source. The heap field loop SHALL NOT produce edges for structural pointer fields (`next`, `prev`, `left`, `right`). Dynamically created nodes SHALL carry all pointer fields as `variables` entries, ensuring Handle generation.

#### Scenario: Visualizing a Tree
- **WHEN** the backend payload contains a `tree_node` with `left` and `right` addresses in `structuralLinks`
- **THEN** the React Flow canvas draws Bezier edges connecting the parent node's `<Handle>` to the child nodes' addresses using structural-link edges only
- **AND** no duplicate edges are emitted from heap field processing

#### Scenario: Visualizing Stack-Allocated Lists
- **WHEN** a user defines `ListNode a; ListNode b; a.next = &b;`
- **THEN** the UI SHALL draw a highly visible SVG arrow connecting the box for `a` to the box for `b`
- **AND** the `next` pointer field SHALL appear in the node's variables with a corresponding `<Handle>`

### Requirement: Structural Node Data Completeness
Every node created from `structuralLinks` SHALL have its `variables` array populated with all data fields (`val`, `data`, etc.) AND all pointer link fields (`next`, `prev`, `left`, `right`). Heap-originated nodes for the same address SHALL NOT overwrite these variables.

#### Scenario: Node shows value and handles
- **WHEN** a linked list node at address `0x5555` has `{"value": {"val": "10"}, "links": {"next": "0x5556"}}` in structuralLinks
- **THEN** the rendered node SHALL display `val: 10` as a variable row
- **AND** SHALL render a `<Handle>` for `next` at the appropriate position
