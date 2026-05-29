## MODIFIED Requirements

### Requirement: Persisted Manual Layout Placements
The memory visualizer canvas SHALL preserve manually dragged node coordinates across execution snapshot transitions. When a node is dragged to a custom location, its custom coordinates MUST be retained when stepping forward or backward in the debugger timeline. In addition, the system SHALL propagate manual coordinates down structural descendants so that a dragged node's entire subtree moves cohesive and maintains relative structural topology.

#### Scenario: Retaining custom node coordinates after stepping
- **WHEN** the user drags a memory node to a new location on the canvas
- **AND** the debugger steps to the next snapshot
- **THEN** the memory node remains at the custom dragged coordinates instead of resetting to the default auto-layout position

#### Scenario: Placement of new memory allocations
- **WHEN** a new heap object node is allocated in a new snapshot
- **THEN** it is positioned automatically by the layout engine
- **AND** existing manually positioned nodes retain their custom coordinates

#### Scenario: Subtree layout preservation on drag
- **WHEN** a parent node of a binary tree or linked list is manually dragged to a custom location
- **THEN** its entire unpositioned descendant subtree SHALL shift coordinates by the same drag offset delta relative to its Dagre auto-layout coordinates

### Requirement: Parent-Relative Node Spawning
The visualizer canvas SHALL initialize the position of newly spawned memory nodes relative to their parent node's coordinates. The spawn location MUST align with the structure type, placing binary tree children below the parent and linked list nodes to the right of the parent, preventing canvas jumps. The spawning calculation SHALL be resolved automatically by inheriting the parent's ancestor delta offset within the layout computation.

#### Scenario: Spawning tree left and right children below the parent
- **WHEN** a binary tree node allocates new left and right child nodes in a snapshot
- **THEN** the left child node initializes at an offset below and to the left of the parent node
- **AND** the right child node initializes at an offset below and to the right of the parent node

#### Scenario: Spawning linked list nodes to the right
- **WHEN** a linked list node allocates a new next node in a snapshot
- **THEN** the new next node initializes at an offset directly to the right of the parent node
