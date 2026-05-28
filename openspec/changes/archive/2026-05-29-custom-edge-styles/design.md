## Context

The React Flow memory canvas currently hardcodes all edge routing types to `smoothstep` (orthogonal lines with rounded corners). While useful for structures like arrays, this can lead to crossed lines and visual clutter in trees or simple stack-to-heap pointer connections. 

## Goals / Non-Goals

**Goals:**
- Provide dynamic, client-side switching of edge styles (Grid, Straight, Curved).
- Persist the user's styling preference in `localStorage`.
- Implement a floating panel directly on the canvas using React Flow's native UI capabilities.

**Non-Goals:**
- Creating custom path-drawing algorithms (using native React Flow line generators).
- Changing backend-side snapshot payloads or protocol.

## Decisions

### Floating Canvas Panel Over App Header Control
- **Choice**: Implement styling controls within a `<Panel position="top-right">` component inside the `ReactFlow` viewport.
- **Rationale**: Localizes visual settings directly in the component they modify, avoiding prop-drilling through `App.tsx`.
- **Alternatives Considered**: Global control bar in `App.tsx` (discarded to keep visual-only settings localized).

### Edge Type Mapping
- **Choice**: Map style options to standard React Flow types:
  - Grid: `smoothstep`
  - Straight: `straight`
  - Curved: `default` (Bezier)
- **Rationale**: Native React Flow types require zero extra dependencies or custom rendering code.

## Risks / Trade-offs

- [Risk] Controls might overlap or obstruct draggable nodes -> [Mitigation] Position the panel in the top-right corner, apply compact sizing, and use a semi-transparent glassmorphic background so nodes behind the panel remain partially visible.
