## MODIFIED Requirements

### Requirement: STL Content Visibility
The UI SHALL fully render the internal contents of Standard Template Library (STL) structures, including 1D/2D Arrays, Vectors, Sets, Maps, Queues, and Stacks.

#### Scenario: Visualizing a std::vector (1D)
- **WHEN** a 1D `std::vector` or raw array is evaluated
- **THEN** the React Flow canvas SHALL render it as a distinct node displaying a sequential list of indexed values (e.g., `[0]: value`)
- **AND** the UI SHALL draw a highly visible SVG arrow linking the stack variable node to the vector elements node if it is stack-allocated

#### Scenario: Visualizing a std::vector (2D)
- **WHEN** a 2D `std::vector` (matrix) is evaluated
- **THEN** the React Flow node SHALL display the elements formatted inside a clean CSS Grid matching the matrix row and column dimensions
- **AND** the UI SHALL draw an SVG pointer edge linking the stack variable to this matrix node
