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
