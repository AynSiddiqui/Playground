## Context
The user specifically requested "only one entire view and in that view only should i be able to see all the different object." The recent architecture shift created separate generic HTML components for Stack and Heap, entirely bypassing the React Flow edge-drawing capabilities that are required to visually trace pointers.

## Goals / Non-Goals

**Goals:**
- Strip out the multi-panel HTML layout (`StackPanel`, `HierarchicalTreeRenderer`, `LinearChainRenderer`).
- Restore the `MemoryCanvas.tsx` to mount a single `<ReactFlow>` component.
- The Stack Frame is injected into the `<ReactFlow>` nodes array as a single large node.
- All Heap Objects are injected into the `<ReactFlow>` nodes array as disjoint nodes.
- Edges are dynamically created by parsing pointer matches between the stack frame locals and heap object addresses.

**Non-Goals:**
- We are not redesigning the backend JSON generation. The backend already provides perfectly flattened nodes. We only need the frontend to draw them correctly.

## Decisions
- **React Flow as the Sole Engine**: By putting everything inside React Flow, we regain the ability to draw SVGs between ANY two objects on the canvas, solving the tangled/missing connections issue.
- **Dagre Layout Engine**: We will hook Dagre directly into the React Flow node set before render, auto-calculating `x` and `y` properties so Binary Trees naturally cascade down and Linked Lists sequence left-to-right on the single infinite canvas.

## Risks / Trade-offs
- **Dagre Performance**: Re-calculating the layout for every step is slightly heavier than hardcoded React DOM components, but necessary to calculate proper edge routing paths to prevent tangled arrows.
