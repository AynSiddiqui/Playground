## ADDED Requirements

### Requirement: Sandbox Execution Boundaries
The system SHALL strictly restrict the debug execution boundary to the user's provided source code. It SHALL prevent stepping into system libraries or external headers (e.g. `libc.so`) by artificially terminating the debug session if the execution pointer leaves the user's scope.

#### Scenario: Stepping out of main
- **WHEN** the user steps past the return statement of `main()`
- **THEN** the system immediately marks the execution as finished instead of querying standard library frames that lack debugging symbols.
