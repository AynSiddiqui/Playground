## Context

The React Flow memory canvas currently relies on `@dagrejs/dagre` to compute node coordinates automatically. This layout is recalculated and reapplied from scratch every time a new execution snapshot is loaded. As a result, any manual position adjustments or node alignments made by the user are immediately overwritten when stepping through code.

## Goals / Non-Goals

**Goals:**
- Retain manual node coordinates across snapshot updates (e.g. when clicking Next/Previous step).
- Allow new nodes that appear in later snapshots to be placed automatically without discarding existing manual layouts.
- Provide a clear layout reset button to re-trigger a clean Dagre auto-layout.

**Non-Goals:**
- Persisting manual layout coordinates in the backend database or program files (in-memory client persistence only).
- Storing layout coordinate overrides for historical sessions (clear on full page refresh is acceptable).

## Decisions

### React useRef Cache for Coordinates
- **Choice**: Store manual positions in a React `useRef` object mapping node IDs to `{ x, y }` coordinates.
- **Rationale**: A ref maintains reference stability and prevents unnecessary re-renders when positions change during a drag interaction.
- **Alternatives Considered**: React state (causes too many re-renders during active drags), localStorage (increases complexity and bloat).

### Merging Drag Interventions
- **Choice**: Use the `onNodeDragStop` callback in `<ReactFlow>` to update the coordinate ref. When rebuilding nodes for a new snapshot, merge cached positions over the computed Dagre values.
- **Rationale**: Rebuilding nodes happens only on snapshot transitions. Overriding positions at that moment ensures stable transition rendering.

### Reset Trigger
- **Choice**: Introduce a floating "Reset Layout" action button within the canvas panel that clears the coordinate ref.
- **Rationale**: Users need an easy escape hatch if custom layouts become messy.

## Risks / Trade-offs

- [Risk] Mismatch between nodes in successive snapshots (e.g., node goes out of scope and disappears) -> [Mitigation] Clean the position cache periodically or allow obsolete node coordinates to lie dormant; they will not impact rendering as they do not match active node IDs.
