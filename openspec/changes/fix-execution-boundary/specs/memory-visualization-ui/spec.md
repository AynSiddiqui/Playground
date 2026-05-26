## ADDED Requirements

### Requirement: Timeline Initial Scrubbing
When the initial execution snapshot or timeline starts, the frontend slider SHALL default to step index `0` (the start of execution) rather than the end of the timeline.

#### Scenario: Initial Load
- **WHEN** the user compiles their code and the first snapshot arrives
- **THEN** the `currentStep` is `0`, displaying the uninitialized or initial state of variables first.
