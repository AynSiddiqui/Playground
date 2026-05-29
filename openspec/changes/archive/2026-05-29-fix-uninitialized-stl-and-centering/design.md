## Context

The C++ memory visualizer extracts stack and heap variables during execution. If local STL variables are uninitialized (before their constructor is called), their stack slots contain garbage values that GDB translates to valid-looking but garbage-filled elements. This results in the frontend drawing up to 1000 random items. Additionally, users navigating complex graph structures need a quick way to center/reset the viewport zoom.

## Goals / Non-Goals

**Goals:**
- Eliminate uninitialized stack STL container clutter (e.g. priority queues/vectors) from the visualizer.
- Provide a button to center/fit all active nodes on the canvas.

**Non-Goals:**
- Validating non-STL uninitialized stack primitives (e.g., standard uninitialized `int`, which are already handled cleanly or ignored).
- Complete automated tracking of all variable life cycles.

## Decisions

### Decision 1: Scope-Based Variable Filtering in GDB
We will check the GDB frame execution line (`sal.line`) against the variable symbol's declaration line (`sym.line`). If `sal.line <= sym.line`, the variable is in scope but its constructor/initializer has not run yet. We will skip extracting this variable until execution advances past its declaration line.
- *Alternatives considered:* Relying purely on value parsing. (Rejected: stack garbage might happen to look valid and we'd still waste GDB performance).

### Decision 2: Vector Pointer Invariant Validation
Before reading vector elements in [stl_printers.py](file:///c:/Users/Ayaan/Desktop/ds/backend/scripts/stl_printers.py), we will check the internal structure pointer fields of `std::vector` (`_M_impl._M_start`, `_M_impl._M_finish`, `_M_impl._M_end_of_storage`):
1. If `_M_start` is NULL, then `_M_finish` and `_M_end_of_storage` must be NULL.
2. Invariant: `_M_start <= _M_finish <= _M_end_of_storage`.
3. Sanity limit: Size and capacity must not exceed `100,000`.
- *Alternatives considered:* Read anyway and truncate. (Rejected: reading garbage memory causes GDB performance latency).

### Decision 3: Resolve Adapters to Underlying Containers
For `std::priority_queue`, `std::stack`, and `std::queue`, we will resolve the value to its underlying container member `c` before running the `ARRAY_1D` extraction logic. This allows the vector validations to automatically apply to these container adapters.

### Decision 4: Frontend Viewport Centering Control
We will use React Flow's `useReactFlow().fitView()` hook to implement a "Center View" button in [MemoryCanvas.tsx](file:///c:/Users/Ayaan/Desktop/ds/frontend/src/components/MemoryCanvas.tsx).

## Risks / Trade-offs

- **[Risk]** `sym.line` or `sal.line` could be `0` or `None` if compiled without `-g` or if the symbol is compiler-generated.
  - **[Mitigation]** Only filter out the variable if `sal.line > 0`, `sym.line > 0`, and `sal.line <= sym.line`. If line information is missing, fall back to evaluating it (which will then be checked by pointer invariants).
- **[Risk]** Accessing `_M_impl` directly is compiler-specific.
  - **[Mitigation]** Wrap the pointer extraction in try-except blocks, and fall back to standard GDB pretty-printing.
