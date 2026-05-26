## ADDED Requirements

### Requirement: Complete Locals Parsing
The debugger SHALL extract all variables from a `-stack-list-locals` MI output array, regardless of how many items are serialized on a single line.

#### Scenario: Multiple unassigned variables
- **WHEN** the backend receives `locals=[{name="a"...},{name="b"...},{name="c"...}]`
- **THEN** it correctly parses and returns all 3 variables, instead of stopping after the first match.

### Requirement: Structural Object Evaluation
The debugger SHALL identify complex variables (structs, classes, pointers) and recursively map their children up to a defined depth.

#### Scenario: User defines a LinkedList Node
- **WHEN** the program steps onto a node definition
- **THEN** the backend fetches the `next` pointer address and populates the `advancedData` payload structure.
