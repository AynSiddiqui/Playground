## MODIFIED Requirements

### Requirement: Sandbox Execution Control
The backend MUST safely evaluate GDB stack frames and variables without causing syntax errors.

#### Scenario: Extracting specific stack frames
- **WHEN** the backend needs metadata (line number, function name) for stack frame N
- **THEN** it must first select the frame using `-stack-select-frame N`, and then execute `-stack-info-frame` without arguments to retrieve the data.
