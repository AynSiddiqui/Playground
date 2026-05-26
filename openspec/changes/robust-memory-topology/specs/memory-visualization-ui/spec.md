## MODIFIED Requirements

### Requirement: Flawless Pointer Resolution
The memory visualizer SHALL correctly route all stack pointer arrows to their target nodes without circular resolution. 
- **WHEN** a user defines `ListNode* temp = head;`
- **THEN** the arrow SHALL point from `temp` to `head`, and SHALL NOT point from `temp` back to `temp`.

### Requirement: Unified Architecture Rendering
The visualizer SHALL render all advanced structures (Binary Trees and Linked Lists) using the exact same Handle generation logic.
- **WHEN** the user instantiates a Binary Tree
- **THEN** the `left` and `right` Handles SHALL be rendered exactly like the `next` Handle in a Linked List, aligning with their respective rows rather than floating arbitrarily at the bottom of the node.
