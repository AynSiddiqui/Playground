## Context
React Flow disables dragging and interactions if the `<ReactFlow>` component is not provided with `onNodesChange` events linked to local component state. Currently, the UI relies on a `useMemo` block that hard-binds node positions to the exact layout computed by Dagre, instantly snapping any dragged node back to its calculated origin. 

Additionally, the missing arrows are caused by a data collision in `buildNodesAndEdges`. The backend initially populates the node with an empty or shallow `fields` array. Later, when the `structuralLinks` loop attempts to populate the deep `subVariables` (which contain the crucial `next` pointer of type `Node*`), it fails because it checks `if (ed.variables.length === 0)`, which may be false.

## Goals / Non-Goals
**Goals:**
- Implement `useNodesState` and `useEdgesState` in `MemoryCanvas.tsx`.
- Connect React Flow's `onNodesChange` to allow fluid dragging.
- Fix the missing `<Handle>` issue by forcibly overriding `variables` with `subVariables` for structural links.

**Non-Goals:**
- We are not changing the backend debugging logic, solely the frontend state architecture.

## Decisions
- **Stateful Snapshot Syncing**: We will use a `useEffect` hook that listens to the `snapshot` prop. When a new snapshot arrives, we compute the Dagre layout once, and then push those coordinates into `setNodes()`. This initializes the positions but allows the user to drag them freely thereafter.
- **Aggressive Hydration**: We will delete the `if (!ed.variables || ed.variables.length === 0)` safety check. If `subVariables` are computed from `structuralLinks`, they are the undisputed source of truth and must overwrite `ed.variables`.
