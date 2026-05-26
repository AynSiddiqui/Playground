## ADDED Requirements

### Requirement: Structured Backend Logging
The websocket server SHALL log the outbound JSON payloads to standard output for every step.

#### Scenario: Monitoring steps
- **WHEN** a new step snapshot is broadcasted
- **THEN** the backend terminal displays the raw JSON string being sent over the socket.
