## ADDED Requirements

### Requirement: Structural Type Tagging
The system SHALL annotate every extracted variable and heap object with an explicit structural type descriptor in the snapshot payload.

#### Scenario: Primitive variable type tag
- **WHEN** the backend extracts an `int`, `float`, `char`, or `bool` variable
- **THEN** the snapshot entry includes `"type": "PRIMITIVE"`

#### Scenario: Array variable type tag
- **WHEN** the backend extracts a C-style array or `std::array`
- **THEN** the snapshot entry includes `"type": "ARRAY_1D"`

#### Scenario: 2D Matrix type tag
- **WHEN** the backend extracts a `std::vector<std::vector<T>>` or nested array
- **THEN** the snapshot entry includes `"type": "MATRIX_2D"`

#### Scenario: Linked list type tag
- **WHEN** the backend encounters a user-defined struct with a `next` pointer attribute pointing to an instance of the same type
- **THEN** the snapshot entry includes `"type": "LINKED_LIST"`

#### Scenario: Binary tree type tag
- **WHEN** the backend encounters a user-defined struct with both `left` and `right` pointer attributes pointing to instances of the same type
- **THEN** the snapshot entry includes `"type": "BINARY_TREE"`

#### Scenario: STL container type tag
- **WHEN** the backend extracts a `std::vector`, `std::map`, or `std::set`
- **THEN** the snapshot entry includes `"type": "STL_CONTAINER"`

### Requirement: Structural Link Resolution
The system SHALL resolve structural links (`next`, `prev`, `left`, `right`) into address-based references in the snapshot payload, completely decoupled from stack frame metadata.

#### Scenario: Linked list node resolution
- **WHEN** a struct contains a `next` pointer that points to another heap-allocated struct of the same type
- **THEN** the snapshot entry includes a `links` object with `"next": "<hex_address>"` and optionally `"prev": "<hex_address>"`, and each reachable node appears as a separate entry in the heap registry

#### Scenario: Binary tree node resolution
- **WHEN** a struct contains `left` and `right` pointers
- **THEN** the snapshot entry includes a `links` object with `"left": "<hex_address>"` and `"right": "<hex_address>"`, and all descendant nodes are included in the heap registry

### Requirement: STL Container Flattening
The system SHALL flatten internal STL implementation details into pure logical representations before serialization.

#### Scenario: std::vector flattening
- **WHEN** a `std::vector<int>` is in scope
- **THEN** the snapshot entry contains an `elements` array with the logical values rather than `_Mypair`, `_M_start`, `_M_finish` compiler metadata

#### Scenario: std::map flattening
- **WHEN** a `std::map<K, V>` is in scope
- **THEN** the snapshot entry contains an `elements` array of `{key, value}` objects rather than `_Mytree` red-black tree node internals

#### Scenario: std::set flattening
- **WHEN** a `std::set<T>` is in scope
- **THEN** the snapshot entry contains an `elements` array of logical values rather than `_Mytree` node internals

## MODIFIED Requirements

### Requirement: Memory Snapshot Extraction
The system SHALL utilize debugger Python APIs and pretty printers to extract the current call stack, local variables, and reachable heap structures into a standardized JSON representation with structural type tags.

#### Scenario: STL container extraction with type tag
- **WHEN** the debugger pauses on a line where a `std::vector` is in scope
- **THEN** the pretty printer intercepts the structure, flattens it to logical elements, formats it as an array in the snapshot JSON, and sets the entry `"type": "STL_CONTAINER"`

### Requirement: Structural Object Evaluation
The debugger SHALL identify complex variables (structs, classes, pointers) and recursively map their children up to a defined depth, tagging the result with the appropriate structural type.

#### Scenario: User defines a LinkedList Node with type tag
- **WHEN** the program steps onto a node definition
- **THEN** the backend fetches the `next` pointer address, resolves the chain, tags the entry as `"type": "LINKED_LIST"`, and populates the `links` payload with sequential address references

## REMOVED Requirements

### Requirement: Complete Locals Parsing
**Reason**: Replaced by the structural type tagging system — all variables are now categorized by type rather than being parsed as a flat list.
**Migration**: The type tagging system subsumes this requirement. Locals are still fully parsed, but the classification is now per-variable via the `type` field.
