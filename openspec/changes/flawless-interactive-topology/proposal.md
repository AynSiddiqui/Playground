## Why

The current memory visualizer has three fatal flaws:
1. **Missing Arrow Connections**: Pointer edges (like `next` in a Linked List) are not drawing because their internal `data` and `next` variables are failing to render inside the node box. This happens because the graph builder fails to override empty/shallow backend data with the deep structural data. If the variables don't render, the React Flow `<Handle>` fails to spawn, and the edge silently drops.
2. **Static Canvas**: Nodes are frozen in place. Dragging them causes them to instantly snap back because the canvas relies on a stateless `useMemo` computation that rigidly enforces Dagre's static layout matrix on every render cycle.
3. **Multiple Pointer Handling**: The UI does not cleanly handle multiple stack variables pointing to the exact same heap node (e.g. `ListNode* cur = a;`).

## What Changes

1. **Forced Data Hydration**:
- In `MemoryCanvas.tsx`, eliminate the `if (!ed.variables || ed.variables.length === 0)` safety condition.
- We will strictly **force** `ed.variables = subVariables` for structural links. This guarantees that `data: 1` and `next: 0x...` are physically rendered in the DOM, forcing the `<Handle>` to spawn, which definitively restores the missing SVG arrows.

2. **Interactive State Upgrade**:
- Refactor `MemoryCanvas.tsx` to use React Flow's `useNodesState` and `useEdgesState`.
- Pass `onNodesChange` and `onEdgesChange` to the `<ReactFlow>` canvas. The Dagre layout will execute exactly once per snapshot to organize the graph beautifully, and then relinquish control so the user can drag nodes freely.

3. **Multi-Pointer Badging**:
- Consolidate all stack pointer nodes into a `pointerLabels` array mapped to the destination heap address. If `a` and `cur` point to `0x3f00...`, that specific heap node will prominently display `[ a ] [ cur ]` as direct badges, gracefully handling multiple references to the same object.

## Capabilities
- `memory-visualization-ui`: Implements `useNodesState` for interactivity. Refactors data hydration logic. Upgrades `MemoryNode.tsx` to render multi-pointer badges natively on the box.
