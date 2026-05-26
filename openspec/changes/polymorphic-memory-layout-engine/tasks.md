## 1. Backend: Structural Type Tagging

- [x] 1.1 Add `classify_variable(var)` function to GDB Python script that returns one of: `PRIMITIVE`, `ARRAY_1D`, `MATRIX_2D`, `LINKED_LIST`, `BINARY_TREE`, `STL_CONTAINER` based on type introspection
- [x] 1.2 Implement type inference for primitives (`int`, `float`, `char`, `bool`) → `PRIMITIVE`
- [x] 1.3 Implement type inference for C-style arrays and `std::array` → `ARRAY_1D`
- [x] 1.4 Implement type inference for nested `std::vector<std::vector<T>>` → `MATRIX_2D`
- [x] 1.5 Implement type inference for user-defined structs with `next` pointer to self → `LINKED_LIST`
- [x] 1.6 Implement type inference for user-defined structs with `left` and `right` pointers to self → `BINARY_TREE`
- [x] 1.7 Implement type inference for `std::vector`, `std::map`, `std::set` → `STL_CONTAINER`
- [x] 1.8 Annotate every snapshot entry with the computed `"type"` field in the JSON payload

## 2. Backend: Structural Link Resolution

- [x] 2.1 For `LINKED_LIST` entries, resolve the `next` pointer chain — traverse from head, follow each `next` address, collect all nodes as a flat address-keyed registry
- [x] 2.2 For `LINKED_LIST` entries with doubly-linked nodes, also resolve `prev` pointers
- [x] 2.3 For `BINARY_TREE` entries, resolve `left` and `right` child pointers — recursively traverse and collect all descendant nodes into a flat address-keyed registry
- [x] 2.4 Output resolved nodes under a `"nodes"` dictionary keyed by hex address, with each node containing `{value, links: {next?, prev?, left?, right?}}`
- [x] 2.5 Add a `"root"` field pointing to the head/root address of the structure
- [x] 2.6 Ensure resolved heap entries are fully decoupled from stack frame metadata (no stack-framed locations in the registry)

## 3. Backend: STL Container Flattening

- [x] 3.1 Update `std::vector` pretty printer to output logical `elements` array instead of `_Mypair`/`_M_start`/`_M_finish` internals
- [x] 3.2 Update `std::map` pretty printer to output `elements` array of `{key, value}` objects instead of `_Mytree` red-black tree nodes
- [x] 3.3 Update `std::set` pretty printer to output `elements` array of values instead of `_Mytree` internals
- [x] 3.4 Add fallback behavior for unsupported STL containers — emit `STL_CONTAINER` with raw child nodes

## 4. Protocol: Snapshot Schema Extension

- [x] 4.1 Add required `"type"` string field to every stack and heap entry in the snapshot JSON schema
- [x] 4.2 Define `LINKED_LIST` and `BINARY_TREE` container schema: `{type, root, nodes: {[address]: {value, links: {...}}}}`
- [x] 4.3 Define `ARRAY_1D` container schema: `{type, elements: [...], dimensions?: [n]}`
- [x] 4.4 Define `MATRIX_2D` container schema: `{type, rows: [[...], ...], dimensions: [r, c]}`
- [x] 4.5 Update WebSocket message handler to serialize with the new schema

## 5. Backend: Console Debug Output

- [x] 5.1 After assembling each snapshot, print the formatted JSON to stderr with indentation for readability
- [x] 5.2 Ensure the console dump is emitted before the WebSocket send to allow debugging of serialization issues

## 6. Frontend: Stack Frame Panel

- [x] 6.1 Create `StackPanel` React Flow sub-graph component rendering a static vertical list of primitive variables and pointer addresses
- [x] 6.2 Render pointer entries with an output handle that projects an edge toward the corresponding heap entry
- [x] 6.3 Ensure the panel stays fixed-position and does not participate in force-directed layout

## 7. Frontend: Grid Layout Renderer

- [x] 7.1 Create `GridRenderer` component for `ARRAY_1D` entries — place cells in a single horizontal row or wrapped grid
- [x] 7.2 Create `GridRenderer` component for `MATRIX_2D` entries — place cells in row-major tabular layout with preserved row/column indices
- [x] 7.3 Add column/row header labels showing indices for 2D matrices
- [x] 7.4 Ensure no floating nodes or edge connections within the grid (self-contained layout)

## 8. Frontend: Linear Chain Renderer

- [x] 8.1 Create `LinearChainRenderer` component for `LINKED_LIST` entries
- [x] 8.2 Implement fixed X-step horizontal node positioning (no force simulation)
- [x] 8.3 Draw directed SVG edges with `markerEnd` arrowheads in the direction of `next`
- [x] 8.4 Optionally render bidirectional edges or a second edge row for `prev` pointers in doubly-linked lists

## 9. Frontend: Hierarchical Tree Renderer

- [x] 9.1 Create `HierarchicalTreeRenderer` component for `BINARY_TREE` entries
- [x] 9.2 Integrate Dagre with `TB` (top-to-bottom) rank direction for tree layout
- [x] 9.3 Assign `left`/`right` edge labels to distinguish child direction
- [x] 9.4 Draw diagonal SVG edges from parent bottom handle to child top handle with arrowheads

## 10. Frontend: Render Dispatcher & Integration

- [x] 10.1 Create a `PolymorphicCanvas` dispatcher that reads the `type` field from each snapshot entry and routes it to the correct renderer
- [x] 10.2 Implement lazy loading of each renderer via dynamic imports keyed by type tag
- [x] 10.3 Split the visualization canvas into the Stack Panel (left) and Heap Space (right) zones
- [x] 10.4 Draw cross-zone edges from stack pointer entries to their target heap nodes

## 11. Frontend: Node Isolation & Edge Animation

- [x] 11.1 Create a shared `BoundedNode` wrapper component with styled border container, value display, and type badge
- [x] 11.2 Add CSS `transition: d 300ms ease` on SVG edge paths for smooth pointer re-targeting
- [x] 11.3 Ensure pointer address changes between snapshots update edge destination without node position glitching
- [x] 11.4 Add colored type badge that appears on hover at the top-right of each bounded node
