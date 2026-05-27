## MODIFIED Requirements

### Requirement: Memory Snapshot Extraction
The system SHALL utilize debugger Python APIs and pretty printers to extract the current call stack, local variables, and reachable heap structures into a standardized JSON representation.

#### Scenario: STL container extraction
- **WHEN** the debugger pauses on a line where a `std::vector` is in scope
- **THEN** the pretty printer intercepts the structure and formats it as an array of logical elements in the snapshot JSON

#### Scenario: Stack-allocated STL container dereference fallback
- **WHEN** the backend evaluates a stack-allocated STL container (e.g. `std::map`, `std::multimap`, `std::pair`) and `dereferencePointer` returns nil due to GDB expression evaluation failure on the complex template type string
- **THEN** the backend SHALL create a HeapObject for the container using the known address and type
- **AND** the backend SHALL populate the HeapObject's elements via the Python pretty-printer extraction path
- **AND** the backend SHALL populate the HeapObject's advanced data via the `adv-dump` Python command
