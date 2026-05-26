## ADDED Requirements

### Requirement: Strict User-Space Framing
The debugger SHALL strictly filter execution states, halting stepping if the execution pointer leaves `main.cpp`.

#### Scenario: Stepping into libc
- **WHEN** the debugger steps out of `main.cpp` into `libc.so`
- **THEN** it immediately returns a program finished error and drops the snapshot.
