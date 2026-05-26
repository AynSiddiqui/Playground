## ADDED Requirements

### Requirement: Structural Type Field in Snapshot Entries
Every variable and heap object entry in the `snapshot` event MUST include a `type` field carrying the structural classification: `PRIMITIVE`, `ARRAY_1D`, `MATRIX_2D`, `LINKED_LIST`, `BINARY_TREE`, or `STL_CONTAINER`.

#### Scenario: Snapshot entry with type field
- **WHEN** the server pushes a `snapshot` event
- **THEN** every entry in `stack` and `heap` arrays contains a `type` string field

### Requirement: Registry-Based Container Format for Trees and Lists
`LINKED_LIST` and `BINARY_TREE` entries SHALL use a flat registry format where nodes are keyed by memory address, with structural links expressed as address references.

#### Scenario: Linked list registry payload
- **WHEN** a linked list is serialized
- **THEN** the `nodes` field contains an object mapping hex addresses to `{value, links: {next?, prev?}}` entries, and `root` points to the head address

#### Scenario: Binary tree registry payload
- **WHEN** a binary tree is serialized
- **THEN** the `nodes` field contains an object mapping hex addresses to `{value, links: {left?, right?}}` entries, and `root` points to the root address

### Requirement: Indexed Format for Arrays and Matrices
`ARRAY_1D` and `MATRIX_2D` entries SHALL use an indexed array format with row-column organization.

#### Scenario: 1D array payload
- **WHEN** a 1D array is serialized
- **THEN** the entry contains an `elements` array of values, with an optional `dimensions` field: `[length]`

#### Scenario: 2D matrix payload
- **WHEN** a 2D matrix is serialized
- **THEN** the entry contains a `rows` array, each row being an array of cell values, and `dimensions: [rows, cols]`

## MODIFIED Requirements

### Requirement: Bidirectional Message Contract
The system SHALL define a strict JSON-based schema for WebSocket communication between the client and backend execution engine. The `snapshot` event SHALL include the `type` field on all variable and heap entries.

#### Scenario: Client initiates session (unchanged)
- **WHEN** the client sends a `start` command with source code
- **THEN** the server begins the compilation and replies with a `status` event indicating "compiling"

#### Scenario: Server sends snapshot with type annotations
- **WHEN** the execution steps forward
- **THEN** the server pushes a `snapshot` event containing the complete state of the stack and heap, with every entry annotated by a `type` field, and complex structures using registry or indexed container formats
