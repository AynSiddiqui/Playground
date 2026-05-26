## ADDED Requirements

### Requirement: Clean Default Code
The UI SHALL provide a distraction-free default C++ template that highlights stack variable initialization without stdout or external includes.

#### Scenario: Initial App Load
- **WHEN** the user first opens the visualizer
- **THEN** they see a simple arithmetic function containing `a`, `b`, and `c` without any `std::cout` statements.
