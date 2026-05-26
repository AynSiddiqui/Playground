## MODIFIED Requirements

### Requirement: Bidirectional Message Contract
The system SHALL define a strict JSON-based schema for WebSocket communication between the client and backend execution engine. The schema MUST support broadcasting `error` events for compilation or runtime failures, and it MUST represent advanced topological data (Trees, 2D Arrays, Linked Lists) appropriately within the `snapshot` data model.

#### Scenario: Client initiates session
- **WHEN** the client sends a `start` command with source code
- **THEN** the server begins the compilation and replies with a `status` event indicating "compiling"

#### Scenario: Server sends snapshot
- **WHEN** the execution steps forward
- **THEN** the server pushes a `snapshot` event containing the complete state of the stack and heap, including tags for complex structures like matrices or trees

#### Scenario: Server sends error
- **WHEN** a sandbox constraint is violated (e.g., timeout)
- **THEN** the server pushes an `error` event with the failure details, avoiding indefinite hanging on the client side
