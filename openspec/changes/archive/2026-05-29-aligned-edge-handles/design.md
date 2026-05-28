## Context

In `MemoryNode.tsx`, the output source handles for pointer fields are positioned using a hardcoded pixel-offset calculation: `top: ${50 + i * 32}px`. This math assumes a rigid row height of 32 pixels. However, actual row heights vary dynamically based on browser font rendering, line heights, paddings, and styles. This mismatch causes pointer connection arrows to start from misaligned offsets on the right edge of node cards.

## Goals / Non-Goals

**Goals:**
- Guarantee that all source handles are perfectly centered vertically relative to their corresponding variable or field rows.
- Remove hardcoded pixel coordinates from the React rendering loops.
- Support dynamic heights and line wrapping on node rows without breaking pointer alignments.

**Non-Goals:**
- Modifying target handle positions on the left side of nodes (which represent node-level targets and should remain centered globally).

## Decisions

### Row-Relative Positioning
- **Choice**: Apply `position: relative` to all `.memory-node__row` containers, and place the `<Handle>` components inside these containers.
- **Rationale**: By nesting the handle within the row, we let CSS handle absolute positioning relative to the row container.
- **Alternatives Considered**: Recalculating offsets dynamically in JavaScript using DOM refs and `getBoundingClientRect` (discarded as it is slow, complex, and prone to race conditions on canvas updates).

### CSS Centering Styling
- **Choice**: Apply `top: 50%` and `transform: translateY(-50%)` inline styles or CSS rules directly to the nested `<Handle>` elements.
- **Rationale**: CSS centering guarantees alignment under any font size, padding, or padding-top/bottom changes.

## Risks / Trade-offs

- [Risk] Custom layout changes inside row divs might clip or hide handles -> [Mitigation] Ensure `.memory-node__row` containers do not have `overflow: hidden`, allowing absolutely positioned handles to render outside the right boundary.
