## MODIFIED Requirements

### Requirement: Split Pane Interface
The frontend SHALL render a dual-pane layout containing a Monaco editor for code and a polymorphic visualization canvas for memory state.

#### Scenario: Viewing current state
- **WHEN** a state snapshot is received
- **THEN** the editor highlights the current executing line and the canvas dispatches each variable/heap entry to its type-specific renderer (Stack Panel, Grid, Linear Chain, or Hierarchical Tree)

### Requirement: Interactive Node Linking
The UI SHALL route variable and heap entries to type-specific React Flow renderers, each with its own layout algorithm and edge configuration.

#### Scenario: Visualizing a Tree with Dagre layout
- **WHEN** the backend payload contains a `BINARY_TREE` entry with `left` and `right` address links
- **THEN** the Hierarchical Tree renderer computes top-down coordinates using Dagre (TB direction), draws diagonal edges with arrowheads connecting parent handles to child nodes

#### Scenario: Visualizing a Linked List as linear chain
- **WHEN** the backend payload contains a `LINKED_LIST` entry with `next`/`prev` address links
- **THEN** the Linear Chain renderer places nodes left-to-right with fixed X spacing, draws directed edges with `markerEnd` arrowheads in the direction of `next`

#### Scenario: Visualizing a Matrix as grid
- **WHEN** the backend payload contains a `MATRIX_2D` entry with a `rows` array
- **THEN** the Grid renderer places cells in a tabular layout preserving row-column indices, with no floating nodes

#### Scenario: Visualizing a 1D Array as grid row
- **WHEN** the backend payload contains an `ARRAY_1D` entry with an `elements` array
- **THEN** the Grid renderer places cells in a single horizontal row or wraps at a configurable column width

## ADDED Requirements

### Requirement: Stack Frame Panel
The frontend SHALL render a static vertical panel displaying only primitive variables and pointer addresses, with pointer entries projecting edges into the Heap Space.

#### Scenario: Pointer edge from stack to heap
- **WHEN** a stack frame entry has `type: "PRIMITIVE"` with a non-null pointer address pointing to a heap entry
- **THEN** the Stack Panel renders an edge from that variable's node handle into the heap entry node, connecting the two panels

### Requirement: Smooth Edge Animation on Pointer Change
The frontend SHALL animate SVG edge destination changes via CSS transitions when a pointer variable is reassigned.

#### Scenario: Pointer re-targeting animation
- **WHEN** a pointer variable changes its target address between two consecutive snapshots
- **THEN** the edge smoothly transitions its destination path over 300ms using CSS `transition: d 300ms ease` instead of snapping instantly or causing node layout glitches

### Requirement: Isolated Bounded Nodes
Every variable instance or dynamic allocation SHALL render inside its own fully bounded, isolated box component with a distinct visual border.

#### Scenario: Every node has a bounding box
- **WHEN** any variable or heap entry is rendered
- **THEN** it appears within a styled rectangular container with a border, type badge, and value display, and no node overlaps with another

### Requirement: Payload Type Badge
Each rendered node SHALL display a colored badge indicating its structural type (`PRIMITIVE`, `ARRAY_1D`, `MATRIX_2D`, `LINKED_LIST`, `BINARY_TREE`, `STL_CONTAINER`).

#### Scenario: Type badge visible on hover
- **WHEN** the user hovers over a rendered node
- **THEN** a colored badge with the type abbreviation appears at the top-right corner of the bounding box
