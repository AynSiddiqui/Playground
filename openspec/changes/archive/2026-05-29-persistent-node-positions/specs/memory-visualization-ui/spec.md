## ADDED Requirements

### Requirement: Persisted Manual Layout Placements
The memory visualizer canvas SHALL preserve manually dragged node coordinates across execution snapshot transitions. When a node is dragged to a custom location, its custom coordinates MUST be retained when stepping forward or backward in the debugger timeline.

#### Scenario: Retaining custom node coordinates after stepping
- **WHEN** the user drags a memory node to a new location on the canvas
- **AND** the debugger steps to the next snapshot
- **THEN** the memory node remains at the custom dragged coordinates instead of resetting to the default auto-layout position

#### Scenario: Placement of new memory allocations
- **WHEN** a new heap object node is allocated in a new snapshot
- **THEN** it is positioned automatically by the layout engine
- **AND** existing manually positioned nodes retain their custom coordinates

### Requirement: Layout Position Reset
The visualizer canvas SHALL provide a mechanism to reset all node coordinates.

#### Scenario: Resetting visual layout coordinates
- **WHEN** the user triggers the reset layout action
- **THEN** all manually dragged node coordinates are cleared
- **AND** the canvas recomputes and applies the default auto-layout positions for all active nodes
