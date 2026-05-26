## MODIFIED Requirements

### Requirement: Secure C++ Compilation
The system SHALL compile the provided C++ source code with debug symbols enabled (`-g`) and optimizations disabled (`-O0`). The system MUST sanitize the source code before compilation to prevent unauthorized system calls and filesystem access.

#### Scenario: Successful compilation
- **WHEN** valid C++ code without malicious system calls is submitted
- **THEN** an executable binary with debug symbols is produced

#### Scenario: Malicious code submission
- **WHEN** C++ code attempting to include forbidden headers or execute system commands is submitted
- **THEN** compilation is rejected and an error is broadcast to the frontend

### Requirement: Isolated Execution
The system SHALL execute the compiled binary within an isolated Docker container sandbox environment enforcing strict memory limits (100MB), CPU limits, a 3-second execution timeout, and complete disablement of network access.

#### Scenario: Execution timeout
- **WHEN** the user code enters an infinite loop
- **THEN** the Docker sandbox process is terminated after the 3-second timeout and an `ERROR` event is generated

#### Scenario: Network access attempted
- **WHEN** the executed code attempts to open a network socket
- **THEN** the attempt fails immediately due to the container's disabled network stack
