## ADDED Requirements

### Requirement: Zero-Initialized Sandbox
The backend compiler SHALL pass `-ftrivial-auto-var-init=zero` (or equivalent) to initialize all user stack variables to 0, ensuring consistent deterministic output for uninitialized variables.

#### Scenario: User defines an uninitialized variable
- **WHEN** the user writes `int a;` and steps over it
- **THEN** the variable evaluates to `0` rather than a random memory address value.
