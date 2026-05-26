## ADDED Requirements

### Requirement: Valid User Space Snapshots
The websocket protocol SHALL only transmit snapshots containing valid user-space data and MUST NOT transmit teardown frames from `libc.so`.

#### Scenario: Teardown prevention
- **WHEN** the backend detects a boundary exit
- **THEN** it sends a `FinishedMessage` without sending a corrupt snapshot
