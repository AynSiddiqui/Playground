## Purpose
The debugger integration module SHALL manage connection to the GDB debugger, step through target program execution, and extract call stack, local variables, and heap objects into a structured JSON snapshot for memory visualization.
## Requirements
### Requirement: Step-by-Step Execution Control
The system SHALL support advancing the execution of the debugged process one source line at a time.

#### Scenario: Advancing execution
- **WHEN** a step command is issued to the backend
- **THEN** the debugger advances to the next line and pauses

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

#### Scenario: Type string pre-cleaning
- **WHEN** a type string contains `std::__cxx11::`
- **THEN** the backend SHALL strip this namespace qualifier (e.g., `std::__cxx11::basic_string<...>` becomes `std::basic_string<...>`)

#### Scenario: basic_string normalization
- **WHEN** a type string contains `std::basic_string<char, std::char_traits<char>, std::allocator<char>>`
- **THEN** the backend SHALL replace it with `std::string`

### Requirement: Complete Locals Parsing
The debugger SHALL extract all variables from a `-stack-list-locals` MI output array, regardless of how many items are serialized on a single line.

#### Scenario: Multiple unassigned variables
- **WHEN** the backend receives `locals=[{name="a"...},{name="b"...},{name="c"...}]`
- **THEN** it correctly parses and returns all 3 variables, instead of stopping after the first match.

### Requirement: Structural Object Evaluation
The debugger SHALL identify complex variables (structs, classes, pointers) and recursively map their children up to a defined depth.

#### Scenario: User defines a LinkedList Node
- **WHEN** the program steps onto a node definition
- **THEN** the backend fetches the `next` pointer address and populates the `advancedData` payload structure
- **AND** the backend SHALL correctly parse the node's struct fields so that `chaseNodePointers` can discover its children

#### Scenario: chaseNodePointers depth limit
- **WHEN** a linked list contains more than 10 nodes
- **THEN** `chaseNodePointers` SHALL stop recursion at depth 10
- **AND** the `advancedData` registry SHALL still contain ALL nodes (since `resolve_structural_links` in Python traverses independently without the same depth limit)

### Requirement: Uninitialized Variable Safety
The system SHALL prevent the extraction and evaluation of stack variables that have not yet been initialized. It SHALL validate STL container memory layouts and pointer invariants before parsing their internal contents.

#### Scenario: Uninitialized local variable filtering
- **WHEN** the debugger frame line is less than or equal to the declaration line of a local stack variable
- **THEN** the variable SHALL be skipped and excluded from the local variables list in the extracted snapshot

#### Scenario: STL container pointer invariant validation
- **WHEN** the debugger extracts elements from a `std::vector` or a container adapter (e.g., `std::priority_queue`, `std::stack`, `std::queue`) wrapping a `std::vector`
- **AND** the container's internal pointers violate invariants (e.g. `start > finish` or `finish > end_of_storage` or size exceeds 100,000)
- **THEN** the debugger SHALL treat the container as empty and return zero elements rather than attempting to read garbage memory addresses

