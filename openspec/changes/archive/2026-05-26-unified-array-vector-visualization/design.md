## Context

The C++ Memory Visualizer frontend fails to display vectors and raw arrays due to missing render blocks for `ARRAY_1D` and `MATRIX_2D`, inconsistent element formats returned by GDB's array and vector pretty printers, a crash in raw 2D array parsing, and a layout orientation check error for binary trees.

## Goals / Non-Goals

**Goals:**
- Unify 1D array and vector serialization formats to `{"index": i, "value": val}`.
- Unify 2D array and vector serialization formats to row lists of strings.
- Render `ARRAY_1D` lists and `MATRIX_2D` CSS Grids on the React Flow canvas (for both vectors and raw arrays).
- Connect stack-allocated STL containers and arrays to their memory representation nodes via edges.
- Orient Binary Trees vertically using Dagre.

**Non-Goals:**
- No changes to Go backend or sandboxed execution runtime.
- No changes to Monaco editor or code highlight logic.

## Decisions

### Decision 1: Unify 1D Elements Format
- **Choice**: Modify `_extract_array` in `stl_printers.py` to append elements as `{"index": i, "value": str(val[i])}`.
- **Rationale**: This guarantees both raw arrays and std::vectors use the exact same JSON format, preventing typescript/runtime errors on the frontend.

### Decision 2: Fallback Row-Major Extraction for 2D Arrays
- **Choice**: In `_extract_matrix`, detect raw arrays using `val.type.code == gdb.TYPE_CODE_ARRAY` and extract elements row-by-row into a nested string array.
- **Rationale**: Prevents crashes on `_M_impl` access for raw arrays and enables matrix rendering.

### Decision 3: Remove `isStl` Render Gating
- **Choice**: In `MemoryNode.tsx`, remove `isStl &&` from the `ARRAY_1D` block.
- **Rationale**: Since raw arrays are not STL, their `isStl` is false. Removing this gate lets them render in the array list block.

### Decision 4: Link Stack STL/Arrays
- **Choice**: In `MemoryCanvas.tsx`, detect local stack STL/array types (`local.type.includes('[')` or STL prefixes) and draw pointer edges.
- **Rationale**: Correctly links stack variables to their elements representation on the visualizer canvas.

## Risks / Trade-offs

- **Risk**: Null pointer dereference on the frontend if `local.type` is null.
  - *Mitigation*: Ensure helper function `isSTLType` check is null-safe.
