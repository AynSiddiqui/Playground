## ADDED Requirements

### Requirement: Independent Variable Nodes
The UI SHALL NOT group local variables into a monolithic stack frame. Instead, every local variable SHALL be mapped as a distinct, independent floating node on the visualizer canvas.

#### Scenario: Visualizing multiple pointers
- **WHEN** the code declares `ListNode* a` and `ListNode* b`
- **THEN** the canvas displays a small box solely for `a` and a small box solely for `b`, each pointing directly to their respective heap targets without their paths artificially crossing.

### Requirement: STL Content Visibility
The UI SHALL fully render the internal contents of Standard Template Library (STL) structures, including 1D/2D Arrays, Vectors, Sets, Maps, Queues, and Stacks.

#### Scenario: Visualizing a std::vector
- **WHEN** a `std::vector<int>` is evaluated
- **THEN** the React Flow node clearly displays a list or grid of the vector's underlying indices and their corresponding integer values.
