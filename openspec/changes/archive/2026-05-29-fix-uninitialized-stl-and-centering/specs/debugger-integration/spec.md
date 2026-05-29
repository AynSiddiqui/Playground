## ADDED Requirements

### Requirement: Uninitialized Variable Safety
The system SHALL prevent the extraction and evaluation of stack variables that have not yet been initialized. It SHALL validate STL container memory layouts and pointer invariants before parsing their internal contents.

#### Scenario: Uninitialized local variable filtering
- **WHEN** the debugger frame line is less than or equal to the declaration line of a local stack variable
- **THEN** the variable SHALL be skipped and excluded from the local variables list in the extracted snapshot

#### Scenario: STL container pointer invariant validation
- **WHEN** the debugger extracts elements from a `std::vector` or a container adapter (e.g., `std::priority_queue`, `std::stack`, `std::queue`) wrapping a `std::vector`
- **AND** the container's internal pointers violate invariants (e.g. `start > finish` or `finish > end_of_storage` or size exceeds 100,000)
- **THEN** the debugger SHALL treat the container as empty and return zero elements rather than attempting to read garbage memory addresses
