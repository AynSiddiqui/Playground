## Context

React Flow edges are currently disjoint from custom row handles because handle IDs are dynamically constructed using a complex prefixed template literal (e.g. `id={\`\${id}-\${v.name}\`}`). Any difference or timing drift in the calculation of `id` (node ID) vs the edge's `sourceHandle` results in React Flow failing to resolve the target element, causing edge lines to fall back and attach to node boundaries or corners instead.

## Goals / Non-Goals

**Goals:**
- Simplify React Flow handle identifiers and edge binding parameters to ensure edges connect cleanly to row-level handles.
- Eliminate complex string concatenation for handle and edge mapping.

**Non-Goals:**
- Changing node-level target handles (which do not require IDs since they are unique per node).

## Decisions

### Simplified Handle and Edge ID Mapping
- **Choice**: Use only the local variable, field, or link key name (e.g. `v.name` or `linkKey`) as the handle ID inside `MemoryNode.tsx`. Update all edge generators in `MemoryCanvas.tsx` to set `sourceHandle` to match this name directly.
- **Rationale**: Since variable/field names are unique within a single node, and React Flow scopes handle lookups to their parent nodes, this is the most robust and standard way to connect row-specific edges.
- **Alternatives Considered**: Retaining the prefixes and trying to debug string matches (discarded as it leaves code fragile to future node ID structure changes).

## Risks / Trade-offs

- [Risk] Variable name collisions across nodes -> [Mitigation] React Flow handle resolution uses a combination of both `source` (node ID) and `sourceHandle` (handle ID). Two distinct nodes can both safely contain handles named `next` or `A` without conflict.
