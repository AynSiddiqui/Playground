## MODIFIED Requirements

### Requirement: Variable Node Collapse
The canvas SHALL NOT render stack pointer variables as independent floating nodes. If a stack variable points to a valid heap allocation, its variable name SHALL be displayed as a visual badge/label directly on the destination heap node.

#### Scenario: Visualizing a Linked List root
- **WHEN** the code declares `ListNode* head = new ListNode{...}`
- **THEN** the canvas displays only one node representing the `ListNode`. The node features a prominent badge labeled `head`, indicating the variable references it.

### Requirement: Structural Variable Visibility
All memory nodes, even complex structural nodes (Trees/Lists), SHALL explicitly render their underlying data and pointer variables (like `next`, `val`, `data`) inside the node body to generate necessary edge handles.

#### Scenario: Visualizing inner nodes
- **WHEN** the user inspects a `ListNode`
- **THEN** the React Flow node clearly lists `data` and `next`, and an explicit SVG arrow connects `next` to the subsequent node.
