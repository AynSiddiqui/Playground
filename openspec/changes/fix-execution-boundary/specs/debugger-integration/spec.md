## ADDED Requirements

### Requirement: Execution Boundary Enforcement
The GDB stepping mechanism SHALL immediately halt stepping and flag the execution as finished if the current frame belongs to a system library or lacks debug symbols (e.g. `func="??"` or `__libc_start_main`).

#### Scenario: Dropping into libc
- **WHEN** the user steps past the final `return` in `main()`
- **THEN** the debugger returns a "program finished" error instead of a corrupt snapshot
