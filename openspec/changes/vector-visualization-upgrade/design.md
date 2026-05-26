## Context

The current C++ Memory Visualizer frontend lacks proper rendering blocks for standard 1D vectors (`ARRAY_1D`) and 2D vectors/matrices (`MATRIX_2D`), resulting in empty node bodies on the visualizer canvas. Furthermore, stack-allocated complex variables are displayed as isolated, disconnected nodes on the canvas without visual pointers linking them to the stack. Finally, binary trees are laid out horizontally instead of vertically due to a mismatched structural field check.

## Goals / Non-Goals

**Goals:**
- Render 1D vectors and arrays as vertical, index-labeled elements.
- Render 2D vectors and matrices as CSS Grids matching their column/row dimensions.
- Connect stack-allocated vectors and arrays to their memory representation nodes via clear pointer edges.
- Orient Binary Trees vertically (Top-to-Bottom) automatically using Dagre.

**Non-Goals:**
- No changes to GDB compilation sandbox or docker container logic.
- No modifications to GDB pretty-printing Python scripts (`stl_printers.py`) since they already correctly classification vectors and matrices.
- No modifications to the time-travel or WebSocket communication protocols.

## Decisions

### Decision 1: Edge Connections for Stack-Allocated Complex Variables
- **Choice**: Modify `buildNodesAndEdges` in `MemoryCanvas.tsx` to identify STL/Array local stack variables and map their target address directly to the heap/STL nodes, rather than mapping the address to the stack variable node itself.
- **Rationale**: Since stack-allocated vectors are extracted to GDB and placed in the heap list as separate nodes (so they can render with structured elements), they must be linked by an arrow from the stack frame variable entry. Preventing the stack entry from claiming the address ensures the arrow points to the actual elements box.
- **Alternatives**: inline nesting (rendering the vector elements directly inside the stack frame box) — rejected because vectors can be very large and clutter the call stack visualization.

### Decision 2: Distinct Renderers for 1D and 2D Vectors
- **Choice**: Implement two separate rendering blocks inside `MemoryNode.tsx` for `ARRAY_1D` and `MATRIX_2D`.
- **Rationale**: 1D containers display best as index-value lists, while 2D matrices demand a grid layout. Dedicating specific blocks avoids clutter and preserves list/tree rendering pathways.

### Decision 3: Vertical Dagre Direction for Trees
- **Choice**: In `MemoryCanvas.tsx`, change `hasBinaryTree` check from `structure === 'tree_node'` to inspect `type === 'BINARY_TREE'`.
- **Rationale**: The GDB python backend outputs `type === 'BINARY_TREE'` instead of `structure`. Aligning the check restores the correct vertical layout hierarchy (`TB`).

## Risks / Trade-offs

- **Risk**: Typescript compilation error if custom vector objects contain null/undefined values.
  - *Mitigation*: Ensure null-safe mapping and optional chaining (`?.`) are used in both canvas edge generation and node render loops.
