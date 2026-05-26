## ADDED Requirements

### Requirement: Prevent Step Queuing
The frontend MUST prevent the user from sending multiple concurrent step commands over the WebSocket.

#### Scenario: User spams the Next button
- **WHEN** the user clicks "Next"
- **THEN** the UI immediately disables the "Next" button and ignores further clicks until the next snapshot is received from the backend.

## MODIFIED Requirements

### Requirement: Default Code Example
The system MUST provide a default C++ code snippet that works reliably.

#### Scenario: New user loads visualizer
- **WHEN** the frontend initializes the code editor
- **THEN** it populates it with a simplified C++ example featuring only primitive variables and simple pointers, avoiding complex STL data structures.
