## ADDED Requirements

### Requirement: Step-by-Step Execution Control
The system SHALL support advancing the execution of the debugged process one source line at a time.

#### Scenario: Advancing execution
- **WHEN** a step command is issued to the backend
- **THEN** the debugger advances to the next line and pauses

### Requirement: Memory Snapshot Extraction
The system SHALL utilize debugger Python APIs and pretty printers to extract the current call stack, local variables, and reachable heap structures into a standardized JSON representation.

#### Scenario: STL container extraction
- **WHEN** the debugger pauses on a line where a `std::vector` is in scope
- **THEN** the pretty printer intercepts the structure and formats it as an array of logical elements in the snapshot JSON
