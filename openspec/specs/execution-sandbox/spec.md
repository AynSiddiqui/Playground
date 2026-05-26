## ADDED Requirements

### Requirement: Secure C++ Compilation
The system SHALL compile the provided C++ source code with debug symbols enabled (`-g`) and optimizations disabled (`-O0`).

#### Scenario: Successful compilation
- **WHEN** valid C++ code is submitted
- **THEN** an executable binary with debug symbols is produced

### Requirement: Isolated Execution
The system SHALL execute the compiled binary within an isolated sandbox environment enforcing memory and CPU limits.

#### Scenario: Execution timeout
- **WHEN** the user code enters an infinite loop
- **THEN** the sandbox process is terminated after the 5-second timeout and an error event is generated
