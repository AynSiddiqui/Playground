## MODIFIED Requirements

### Requirement: Memory Snapshot Extraction
The system SHALL utilize debugger Python APIs and pretty printers to extract the current call stack, local variables, and reachable heap structures into a standardized JSON representation. The pretty printers MUST correctly parse and output complex advanced data structures including standard 2D arrays (matrices), Linked Lists (detecting `next` pointers), and Binary Trees (detecting `left`/`right` pointers).

#### Scenario: STL container extraction
- **WHEN** the debugger pauses on a line where a `std::vector` is in scope
- **THEN** the pretty printer intercepts the structure and formats it as an array of logical elements in the snapshot JSON

#### Scenario: Linked List extraction
- **WHEN** the debugger traverses a heap object with a `next` pointer
- **THEN** it correctly classifies the object as a Linked List node and traces the pointers without infinite looping on cyclic references

#### Scenario: Binary Tree extraction
- **WHEN** the debugger traverses a heap object with `left` and `right` pointers
- **THEN** it correctly classifies the object as a Tree node and traces its children
