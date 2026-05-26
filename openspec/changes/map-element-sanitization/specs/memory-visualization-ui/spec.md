## MODIFIED Requirements

### Requirement: STL Content Visibility
The UI SHALL fully render the internal contents of Standard Template Library (STL) structures, including 1D/2D Arrays, Vectors, Sets, Maps, Queues, and Stacks.

#### Scenario: Visualizing 1D Vectors and Arrays
- **WHEN** a 1D vector or a raw array is evaluated
- **THEN** the React Flow visualizer SHALL render it as a distinct node displaying a list of elements with their indices (e.g. `[0]: value`)
- **AND** the UI SHALL draw an SVG edge connecting the stack variable entry to this node if it is stack-allocated

#### Scenario: Visualizing 2D Vectors and Arrays
- **WHEN** a 2D vector or a raw 2D array is evaluated
- **THEN** the React Flow visualizer SHALL render the elements inside a CSS Grid matching the row and column dimensions of the structure
- **AND** the UI SHALL draw an SVG pointer edge linking the stack variable to this matrix node

#### Scenario: Visualizing Maps and Sets
- **WHEN** a `std::map` or `std::unordered_map` is evaluated
- **THEN** the React Flow visualizer SHALL render the key-value elements in a structured table layout with "Key" and "Value" column headers.
- **AND** the UI SHALL draw an SVG pointer edge linking the stack variable to this map node.

#### Scenario: Stack-allocated STL Container Summary
- **WHEN** an STL container is stack-allocated and displayed as a local variable node
- **THEN** its value display SHALL show a clean summary format including the container type and size (e.g. `std::map (size=N)`) rather than raw internal GDB tree structures.

#### Scenario: Collapsible Node Body and State Persistence
- **WHEN** an STL container node is rendered on the canvas
- **THEN** the node header SHALL display a cleaned type name and a collapse/expand toggle button
- **AND** clicking the toggle button SHALL expand or collapse the key-value/element content body
- **AND** this expand/collapse state SHALL be persisted when travelling/stepping to a new line snapshot.

#### Scenario: Sanitized Map Elements Display
- **WHEN** map elements are displayed
- **THEN** key column values SHALL be strings representing the actual keys (without GDB internal structures or pointer address prefixes)
- **AND** value column values SHALL be the actual string/primitive values or text hex addresses (for pointer values).

#### Scenario: Responsive Column Layout Without Overflow Clipping
- **WHEN** a map or set table is rendered
- **THEN** the node width SHALL be expanded to 300px and the cells SHALL be sized at 50% width
- **AND** the Value column SHALL remain fully visible within the node boundaries without being clipped.
