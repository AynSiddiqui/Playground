## MODIFIED Requirements

### Requirement: Independent Variable Nodes
The UI SHALL NOT group local variables into a monolithic stack frame. Instead, every local variable SHALL be mapped as a distinct, independent floating node on the visualizer canvas. If multiple stack pointers reference the exact same heap memory address, they SHALL NOT be merged or hidden.

#### Scenario: Visualizing multiple pointers
- **WHEN** the code declares `ListNode* a` and `ListNode* b`
- **THEN** the canvas displays a small box solely for `a` and a small box solely for `b`, each pointing directly to their respective heap targets without their paths artificially crossing.

#### Scenario: Visualizing Hare & Tortoise
- **WHEN** the user declares `ListNode* slow` and `ListNode* fast` both pointing to the head of a linked list.
- **THEN** the UI renders two distinct floating nodes (`📍 slow` and `📍 fast`).
- **AND** both nodes emit distinctly colored, animated SVG arrows pointing directly to the list's head node, physically tracking their movement as the algorithm steps.

#### Scenario: Visualizing Reference Variables Sharing Addresses
- **WHEN** a stack variable is of a C++ reference type (containing `&`) and shares its address with another stack or heap object
- **THEN** the UI SHALL draw an SVG arrow connecting the reference variable node to the target object sharing the same memory address.

### Requirement: STL Content Visibility
The UI SHALL fully render the internal contents of Standard Template Library (STL) structures, including 1D/2D Arrays, Vectors, Sets, Maps, Queues, Stacks, and Pairs. Map and Pair value cells SHALL be left-aligned to align with table headers.

#### Scenario: Visualizing 1D Vectors and Arrays
- **WHEN** a 1D vector or a raw array is evaluated
- **THEN** the React Flow visualizer SHALL render it as a distinct node displaying a list of elements with their indices (e.g. `[0]: value`)
- **AND** the UI SHALL draw an SVG edge connecting the stack variable entry to this node if it is stack-allocated

#### Scenario: Visualizing 2D Vectors and Arrays
- **WHEN** a 2D vector or a raw 2D array is evaluated
- **THEN** the React Flow visualizer SHALL render the elements inside a CSS Grid matching the row and column dimensions of the structure
- **AND** the UI SHALL draw an SVG pointer edge linking the stack variable to this matrix node

#### Scenario: Visualizing Map and Pair Alignments
- **WHEN** an STL map or pair is rendered
- **THEN** the key-value elements are displayed in a table where both the keys and value cells are left-aligned to match the column headers.

#### Scenario: Visualizing std::pair as STL type
- **WHEN** a std::pair variable is present
- **THEN** it is recognized as an STL container type on the canvas and displays its `first` and `second` elements.
