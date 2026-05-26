## ADDED Requirements

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
