## ADDED Requirements

### Requirement: Bidirectional Message Contract
The system SHALL define a strict JSON-based schema for WebSocket communication between the client and backend execution engine.

#### Scenario: Client initiates session
- **WHEN** the client sends a `start` command with source code
- **THEN** the server begins the compilation and replies with a `status` event indicating "compiling"

#### Scenario: Server sends snapshot
- **WHEN** the execution steps forward
- **THEN** the server pushes a `snapshot` event containing the complete state of the stack and heap
