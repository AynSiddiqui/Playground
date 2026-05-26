## ADDED Requirements

### Requirement: Library Exit Boundary
The debugger SHALL strictly monitor the `from` and `func` attributes of execution frames and immediately halt the session if execution bleeds into standard libraries (`/lib/`).

#### Scenario: Dropping into libc.so.6
- **WHEN** execution leaves `main()` and falls into `libc` teardown
- **THEN** the debugger returns a finished error and stops yielding steps.
