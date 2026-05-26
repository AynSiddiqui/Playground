## ADDED Requirements

### Requirement: Python STL Pretty Printers
The backend SHALL use Python scripting to interact with the GDB API, providing robust extraction of C++ Standard Template Library containers into flat JSON structures representing heap objects.

#### Scenario: Vector extraction
- **WHEN** the debugger encounters a `std::vector` in memory
- **THEN** it extracts the elements into an array without infinitely recursing into the raw struct internals.

### Requirement: Tree and List Pointer Recognition
The Python printer MUST explicitly identify structural pointers (such as `next`, `prev`, `left`, `right`) and map them as connections between separate heap nodes, rather than embedding the child node deeply inside the parent node's JSON structure.

#### Scenario: Binary tree traversal
- **WHEN** a `TreeNode` with `left` and `right` pointers is evaluated
- **THEN** the backend issues a flat `HeapObject` for the root, and appends `HeapObject`s for the children, referencing them by memory address instead of nesting their data.
