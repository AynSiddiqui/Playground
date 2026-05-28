## ADDED Requirements

### Requirement: Parent-Relative Node Spawning
The visualizer canvas SHALL initialize the position of newly spawned memory nodes relative to their parent node's coordinates. The spawn location MUST align with the structure type, placing binary tree children below the parent and linked list nodes to the right of the parent, preventing canvas jumps.

#### Scenario: Spawning tree left and right children below the parent
- **WHEN** a binary tree node allocates new left and right child nodes in a snapshot
- **THEN** the left child node initializes at an offset below and to the left of the parent node
- **AND** the right child node initializes at an offset below and to the right of the parent node

#### Scenario: Spawning linked list nodes to the right
- **WHEN** a linked list node allocates a new next node in a snapshot
- **THEN** the new next node initializes at an offset directly to the right of the parent node
