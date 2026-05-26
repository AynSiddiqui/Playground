## ADDED Requirements

### Requirement: Split Pane Interface
The frontend SHALL render a dual-pane layout containing a Monaco editor for code and a visualization canvas (D3/React Flow) for memory state.

#### Scenario: Viewing current state
- **WHEN** a state snapshot is received
- **THEN** the editor highlights the current executing line and the canvas updates to reflect the variables and pointers

### Requirement: Frontend Time Travel
The frontend SHALL maintain an array of received snapshots to allow instant forward and backward navigation without server round-trips.

#### Scenario: Rewinding state
- **WHEN** the user clicks "Previous" and the current timeline index > 0
- **THEN** the UI instantly renders the previous state from the local cache without sending a command to the server
