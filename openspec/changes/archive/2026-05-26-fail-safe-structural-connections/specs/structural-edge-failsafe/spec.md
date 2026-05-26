## ADDED Requirements

### Requirement: Structural Edge Fail-Safe Path

The frontend SHALL render structural edges (next/prev/left/right) for linked lists and binary trees unconditionally, using data from any available source: stack `structuralLinks`, heap `AdvancedData`, or heap struct fields — in that priority order — with correct deduplication.

#### Scenario: Heap AdvancedData provides structural registry

- **WHEN** a heap object's `advancedData` contains a `type` of `LINKED_LIST` or `BINARY_TREE` with a `nodes` registry
- **THEN** the frontend SHALL create nodes and edges for all entries in the registry, even if no stack local has `structuralLinks`

#### Scenario: Stack structurallinks and heap AdvancedData overlap

- **WHEN** both a stack local's `structuralLinks` AND a heap object's `advancedData` describe the same linked list or tree
- **THEN** the frontend SHALL NOT create duplicate nodes or edges, using `structuralNodeIds` for deduplication

#### Scenario: Neither stack structurallinks nor heap AdvancedData present

- **WHEN** neither data source describes structural links
- **THEN** the frontend SHALL fall back to scanning heap struct fields for `next`, `prev`, `left`, `right` pointer fields and creating edges from those

#### Scenario: Heap struct field edge concurrency with structural processing

- **WHEN** a structural data source (stack or heap) already created an edge for a `next`/`prev`/`left`/`right` pointer
- **THEN** the heap struct field loop SHALL skip that field to prevent duplicate edges
- **WHEN** no structural source created the edge
- **THEN** the heap struct field loop SHALL create the edge normally

### Requirement: Complete Field Parsing from GDB Evaluation

The Go backend `parseFieldsFromEval` function SHALL extract field `name`, `type`, and `value` from GDB's `-data-evaluate-expression` output for struct types, enabling `chaseNodePointers` to detect pointer fields and recursively discover child heap nodes.

#### Scenario: Parsing a struct field with pointer type

- **WHEN** GDB evaluates `*(struct Node*)0x5555` and returns `{data = 42, next = 0x7777}`
- **THEN** the parser SHALL produce two fields: `{Name: "data", Type: "int", Value: "42"}` and `{Name: "next", Type: "struct Node *", Value: "0x7777"}`

#### Scenario: chaseNodePointers finds children via next pointer

- **WHEN** a struct field `next` is parsed with a non-zero pointer value
- **THEN** `chaseNodePointers` SHALL dereference that pointer and add the child to the heap array
- **AND** recursively chase the child's own `next`, `prev`, `left`, `right`, `parent` fields up to max depth 10

## MODIFIED Requirements

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

### Requirement: Structural Object Evaluation

The debugger SHALL identify complex variables (structs, classes, pointers) and recursively map their children up to a defined depth.

#### Scenario: User defines a LinkedList Node

- **WHEN** the program steps onto a node definition
- **THEN** the backend fetches the `next` pointer address and populates the `advancedData` payload structure
- **AND** the backend SHALL correctly parse the node's struct fields so that `chaseNodePointers` can discover its children

#### Scenario: chaseNodePointers depth limit

- **WHEN** a linked list contains more than 10 nodes
- **THEN** `chaseNodePointers` SHALL stop recursion at depth 10
- **AND** the `advancedData` registry SHALL still contain ALL nodes (since `resolve_structural_links` in Python traverses independently without the same depth limit)
