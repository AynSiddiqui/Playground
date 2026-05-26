## ADDED Requirements

### Requirement: Stable Frontend Identity
The visualizer UI SHALL assign stable node identities (using variable names and addresses) rather than loop indices, ensuring smooth visual updates.

#### Scenario: Updating a variable
- **WHEN** a variable changes value
- **THEN** the React Flow node updates its content without unmounting and remounting.

### Requirement: Debug JSON Panel
The visualizer UI SHALL provide a collapsible debug panel showing the raw JSON of the current snapshot.

#### Scenario: Viewing payload
- **WHEN** the user opens the Debug Panel
- **THEN** they see the exact raw JSON object corresponding to the currently viewed timeline step.
