## MODIFIED Requirements

### Requirement: Interactive Node Dragging
All memory nodes and badges SHALL be independently draggable across the React Flow canvas. The UI must maintain their updated positions until the execution step officially advances and recalculates the graph.

#### Scenario: User organizing a complex layout
- **WHEN** a user clicks and drags a Heap Object node to the right
- **THEN** the node follows the cursor smoothly, and all attached SVG pointer arrows dynamically redraw to follow the new position without snapping back.

### Requirement: Enforced Structural Handles
Any pointer mapped from a complex structure (e.g., `next` inside a Linked List) SHALL reliably spawn a physical edge connection Handle, ensuring structural arrows are never dropped.

#### Scenario: Viewing a Linked List
- **WHEN** the user steps through `a->next = b`
- **THEN** the box for `a` unconditionally displays the `next` variable and draws a highly visible pointer line directly to the node for `b`.
