## Context

By default, the visualizer initializes all new nodes at coordinate `(0, 0)` before applying the Dagre layout. This results in visual jumping and jarring animations when new structures (like binary tree branches or linked list nodes) are dynamically allocated on step-debugging. Positioning new nodes relative to their reference parent's current position prevents these visual layout jumps.

## Goals / Non-Goals

**Goals:**
- Identify when a node is new and resolve its reference parent.
- Position child tree nodes directly below their parents with left/right offsets.
- Position next list nodes directly to the right of their parents.
- Apply this parent-relative position as the baseline coordinate for smooth canvas transitions.

**Non-Goals:**
- Forcing auto-positioning on nodes that the user has manually dragged (manual overrides take precedence).

## Decisions

### Scanning Active Connections for Parents
- **Choice**: Before computing the layout in `MemoryCanvas.tsx`, extract the current list of nodes and map existing node coordinates. For each new node:
  1. Find any active edge pointing to the new node.
  2. If found, retrieve the source node's current coordinates.
  3. Apply parent-relative offset positions:
     - Left tree nodes: `(parent.x - 140, parent.y + 180)`
     - Right tree nodes: `(parent.x + 140, parent.y + 180)`
     - Next list nodes: `(parent.x + 280, parent.y)`
- **Rationale**: Since structural edges are built before layout, scanning them is the most reliable way to find semantic parent-child relationships.

### Layout Seeding
- **Choice**: Apply these parent-relative coordinates to the new node's initial `position` property before pushing to the React Flow node state.
- **Rationale**: Seeding coordinates directly in React Flow's state allows the layout animations to transition smoothly from the parent node rather than snapping from the canvas origin.

## Risks / Trade-offs

- [Risk] Parent node also does not have a valid position (e.g. both are newly spawned) -> [Mitigation] Fall back recursively to find the grandparent's position, or if none, use the standard layout origin.
