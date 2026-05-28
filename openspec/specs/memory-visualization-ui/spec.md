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

#### Scenario: Simplified type display for containers
- **WHEN** a `std::map<std::string, int>` or any other STL container is displayed
- **THEN** the type label SHALL show only the meaningful template arguments (e.g., `std::map<std::string, int>`), not the full instantiation including `std::allocator`, `std::less`, or `std::__cxx11::` qualifiers

#### Scenario: Stack variable type display
- **WHEN** a stack-allocated STL container variable is shown as a distinct node
- **THEN** the type shown in the variable row SHALL use the simplified type string
- **AND** the raw GDB type SHALL be available on hover via a tooltip

### Requirement: Configurable Edge Styles
The memory visualizer canvas SHALL provide a user interface element allowing developers to toggle between Grid, Straight, and Curved edge connection styles. The selected configuration MUST be persisted locally in the browser storage and automatically applied to all pointer and reference lines on canvas reload or snapshot changes.

#### Scenario: Toggling line style to Curved
- **WHEN** the user selects the Curved option in the line style control panel
- **THEN** all stack-to-heap and heap-to-heap connection lines are rendered as Bezier curves
- **AND** the preference is saved in localStorage

#### Scenario: Persisting line style preference
- **WHEN** the page is reloaded
- **THEN** the memory canvas retrieves the saved edge styling preference from localStorage
- **AND** initializes the visualizer canvas with the saved edge style

### Requirement: Persisted Manual Layout Placements
The memory visualizer canvas SHALL preserve manually dragged node coordinates across execution snapshot transitions. When a node is dragged to a custom location, its custom coordinates MUST be retained when stepping forward or backward in the debugger timeline.

#### Scenario: Retaining custom node coordinates after stepping
- **WHEN** the user drags a memory node to a new location on the canvas
- **AND** the debugger steps to the next snapshot
- **THEN** the memory node remains at the custom dragged coordinates instead of resetting to the default auto-layout position

#### Scenario: Placement of new memory allocations
- **WHEN** a new heap object node is allocated in a new snapshot
- **THEN** it is positioned automatically by the layout engine
- **AND** existing manually positioned nodes retain their custom coordinates

### Requirement: Layout Position Reset
The visualizer canvas SHALL provide a mechanism to reset all node coordinates.

#### Scenario: Resetting visual layout coordinates
- **WHEN** the user triggers the reset layout action
- **THEN** all manually dragged node coordinates are cleared
- **AND** the canvas recomputes and applies the default auto-layout positions for all active nodes

### Requirement: Row-Aligned Source Handles
The visualizer canvas SHALL center all source handles vertically on the right edge of their corresponding variable or field rows. The handle vertical offset MUST adapt dynamically to any variation in row height caused by font changes, line wrapping, or padding adjustments, without using hardcoded pixel math.

#### Scenario: Aligning handles to dynamic height rows
- **WHEN** a memory node containing multiple pointer fields is rendered
- **THEN** every source connection handle on the right edge aligns exactly with the vertical center of its corresponding row
- **AND** the handle positions remain centered even if row heights vary

### Requirement: Parent-Relative Node Spawning
The visualizer canvas SHALL initialize the position of newly spawned memory nodes relative to their parent node's coordinates. The spawn location MUST align with the structure type, placing binary tree children below the parent and linked list nodes to the right of the parent, preventing canvas jumps.

#### Scenario: Spawning tree left and right children below the parent
- **WHEN** a binary tree node allocates new left and right child nodes in a snapshot
- **THEN** the left child node initializes at an offset below and to the left of the parent node
- **AND** the right child node initializes at an offset below and to the right of the parent node

#### Scenario: Spawning linked list nodes to the right
- **WHEN** a linked list node allocates a new next node in a snapshot
- **THEN** the new next node initializes at an offset directly to the right of the parent node

