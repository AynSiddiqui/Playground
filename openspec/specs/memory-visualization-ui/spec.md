## Purpose
The memory visualization UI SHALL provide an interactive, real-time graphical representation of C++ program memory state, enabling developers to visually trace pointer relationships and inspect data structures during debugging.
## Requirements
### Requirement: Split Pane Interface
The frontend SHALL render a dual-pane layout containing a Monaco editor for code and a visualization canvas (D3/React Flow) for memory state.

#### Scenario: Viewing current state
- **WHEN** a state snapshot is received
- **THEN** the editor highlights the current executing line and the canvas updates to reflect the variables and pointers

### Requirement: Frontend Time Travel
The frontend SHALL maintain an array of received snapshots to allow instant forward and backward navigation without server round-trips.

#### Scenario: Rewinding state
- **WHEN** the user clicks "Previous" and the current timeline index > 0
- **THEN** the UI instantly renders the previous state from the local cache without sending a command to the server

### Requirement: Guaranteed Edge Rendering
The UI SHALL render SVG edges between Memory Nodes for all recognized structural relationships (Linked Lists, Binary Trees), unconditionally handling data mapped to either `structuralLinks` or `advancedData`.

#### Scenario: Visualizing a Tree
- **WHEN** the backend payload contains a `tree_node` with `left` and `right` addresses
- **THEN** the React Flow canvas draws Bezier edges connecting the parent node's `<Handle>` to the child nodes' addresses.

#### Scenario: Visualizing Stack-Allocated Lists
- **WHEN** a user defines `ListNode a; ListNode b; a.next = &b;`
- **THEN** the UI SHALL draw a highly visible SVG arrow connecting the box for `a` to the box for `b`, instead of ignoring the stack variable's structural links.

#### Scenario: No structural data source available
- **WHEN** neither `structuralLinks` on any stack local nor `advancedData` on any heap object contains structural type information for a linked list or binary tree
- **THEN** the UI SHALL still render edges by scanning struct fields for `next`/`prev`/`left`/`right` pointer values in the heap object's field list

### Requirement: Variable Initialization Context
The UI SHALL gracefully display uninitialized memory values without breaking layouts, and may annotate them to prevent confusion for beginners.

#### Scenario: Uninitialized stack variable
- **WHEN** a variable contains a value like `29790`
- **THEN** it is displayed cleanly, updating smoothly on the next step when the explicit assignment executes.

### Requirement: Independent Variable Nodes
The UI SHALL NOT group local variables into a monolithic stack frame. Instead, every local variable SHALL be mapped as a distinct, independent floating node on the visualizer canvas. If multiple stack pointers reference the exact same heap memory address, they SHALL NOT be merged or hidden.

#### Scenario: Visualizing multiple pointers
- **WHEN** the code declares `ListNode* a` and `ListNode* b`
- **THEN** the canvas displays a small box solely for `a` and a small box solely for `b`, each pointing directly to their respective heap targets without their paths artificially crossing.

#### Scenario: Visualizing Hare & Tortoise
- **WHEN** the user declares `ListNode* slow` and `ListNode* fast` both pointing to the head of a linked list.
- **THEN** the UI renders two distinct floating nodes (`📍 slow` and `📍 fast`).
- **AND** both nodes emit distinctly colored, animated SVG arrows pointing directly to the list's head node, physically tracking their movement as the algorithm steps.

### Requirement: STL Content Visibility
The UI SHALL fully render the internal contents of Standard Template Library (STL) structures, including 1D/2D Arrays, Vectors, Sets, Maps, Queues, and Stacks.

#### Scenario: Visualizing a std::vector
- **WHEN** a `std::vector<int>` is evaluated
- **THEN** the React Flow node clearly displays a list or grid of the vector's underlying indices and their corresponding integer values.

