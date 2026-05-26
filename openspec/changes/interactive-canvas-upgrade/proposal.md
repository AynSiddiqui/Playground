## Why

The visualizer currently suffers from two major UX flaws:
1. **Frozen Canvas**: The React Flow nodes are completely static. When a user tries to drag a node to manually organize their linked list or stack variables, the node refuses to move. This breaks the fundamental interactivity expected from a canvas diagram.
2. **Missing Inter-Node Arrows & Data**: While we successfully removed the bypass hiding the data, the pointers (arrows) connecting the Linked List nodes have vanished. This is caused by a race condition in the node generation loop: if a node already exists with an empty or partial variable list, the newly generated structural variables (like `next: 0x...`) are not aggressively overwriting it, causing the handle to disappear and the edge to drop.

## What Changes

1. **Enable Interactive Dragging**: 
- Transition `MemoryCanvas.tsx` from a stateless render (where `nodes` are derived purely from props via `useMemo`) to a stateful render using React Flow's `useNodesState` and `useEdgesState`. 
- Hook up the `onNodesChange` and `onEdgesChange` handlers so users can freely drag and organize nodes across the infinite canvas.

2. **Force Structural Hydration**: 
- In the `MemoryCanvas.tsx` graph builder, remove the safe `if (!ed.variables || ed.variables.length === 0)` condition. 
- For any node that is part of a complex structure (Trees, Linked Lists), **unconditionally** overwrite its `data.variables` with the deeply parsed `subVariables`. This guarantees that the `data` and `next` pointer Handle will spawn, thereby restoring the arrows and inner data to the canvas perfectly.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: The graph must become fully mutable on the frontend via React state hooks. The structural data extraction loop must forcibly inject its variables over any pre-existing shallow node data to ensure Handles are generated.

## Impact
- **Frontend**: The canvas goes from a rigid, frozen picture to a fully interactive drag-and-drop workspace. The missing arrows and empty boxes will instantly resolve as the Handle generation is guaranteed.
