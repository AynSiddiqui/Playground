## Context

When rendering relational data structures like binary trees or linked lists, custom node positioning is critical. Currently, dragging a parent node disconnects it visually from its child nodes because children remain at their default auto-layout coordinates. When new children spawn, they snap to default coordinates instead of following the parent's dragged position.

## Goals / Non-Goals

**Goals:**
- Implement dynamic subtree delta propagation during layout calculations.
- Retain topological relative layout structure calculated by Dagre when subtrees are shifted.
- Ensure new child nodes inherit manual offsets and spawn correctly relative to the parent.

**Non-Goals:**
- Propagating manual offsets across stack-to-heap pointers (which can cause heap segments to merge erroneously).

## Decisions

### Decision 1: Directed Adjacency Map for Structural Edges
We will parse all active canvas edges to build a directed adjacency map (`childrenMap`) from parent to child. We will only record relationships along internal heap structural edges. An edge is a heap structural edge if it is a structural link, identified by suffixes matching:
- `-left`, `-right` (binary trees)
- `-next`, `-prev` (linked lists)
Other edges (e.g. stack variable pointers) are ignored to avoid drag contamination.

### Decision 2: DFS Delta Propagation with Cycle Detection
During layout, we will initialize a `deltas` map for manually positioned nodes: `delta = manualPosition - dagrePosition`.
We will then run a depth-first traversal starting from graph roots:
1. Maintain a `visited` set to prevent infinite loops from circular pointers.
2. Inherit the parent's delta if the current node does not have its own manual position.
3. Apply the delta to shift the final position of all nodes: `finalPosition = dagrePosition + delta`.

## Risks / Trade-offs

- **[Risk]** Cycles in structural pointers (e.g., circular linked lists) causing stack overflow.
  - **[Mitigation]** The `visited` set tracks traversed node IDs and aborts the traversal branch on cycle detection.
