## 1. Backend STL & Struct Extractors (Python)
- [x] 1.1 In `backend/scripts/stl_printers.py`, create robust extraction methods (`_extract_tree`, `_extract_list`, `_extract_stl`) that parse C++ structures and map pointers to memory addresses. Ensure they output flat nodes rather than recursive nesting.
- [x] 1.2 In `backend/scripts/stl_printers.py`, enforce stable unique `id` generation based on the struct/element's memory address to ensure stable DOM references in the frontend.

## 2. Backend GDB Pointer Chasing (Go)
- [x] 2.1 In `backend/internal/debugger/gdb.go`, modify `chaseNodePointers` (and any related extraction loops) to append every discovered pointer target into a single flat `[]HeapObject` slice, eliminating nested graph payloads.

## 3. Frontend Layout Engine (React Flow)
- [x] 3.1 Run `npm install dagre` (if not already installed) to add Dagre.js to the frontend.
- [x] 3.2 In `frontend/src/components/MemoryCanvas.tsx`, implement a custom `getLayoutedElements` function using `dagre` to compute hierarchical `x` and `y` coordinates for `HeapObject` nodes.
- [x] 3.3 In `MemoryCanvas.tsx`, update the Stack generation loop to strip complex nested structures and ONLY print the primitive representation, letting the Heap nodes represent the structure itself.

## 4. Frontend Transitions & Edges
- [x] 4.1 In `MemoryCanvas.tsx`, add `markerEnd: { type: MarkerType.ArrowClosed }` (or similar) to the edge properties to ensure all edges have visible directionality.
- [x] 4.2 In `frontend/src/index.css`, add `transition: transform 0.4s ease, opacity 0.4s ease;` to `.react-flow__node` or the custom node classes so positional updates animate smoothly.
