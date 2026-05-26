## Context
To make the visualizer perfect, we must correctly classify primitive stack variables (which should stay in the stack frame) from complex stack variables (which need their own disjoint graphical node and an arrow pointing to them).

## Decisions

1. **Backend Variable Routing**: We will update `stl_printers.py::_capture_locals` to attach the `address` field to all STLs, Arrays, and Structs, bypassing the strict `gdb.TYPE_CODE_PTR` check. `gdb.go::extractHeapObjects` will be updated to extract any variable that has an `Address` set, regardless of if it's a pointer. This elegantly solves the issue.
2. **Schema Update**: We will add `address` as an optional field to the `Variable` struct in `gdb.go` so it properly survives JSON unmarshaling from the Python script to the Go parser.
3. **Edge Logic**: The React Flow `target` mapping in `MemoryCanvas.tsx` will no longer discriminate against non-pointer types, fixing the missing/misaligned arrows.
4. **CSS Implementation**: Standard `.highlighted-line { background: rgba(16, 185, 129, 0.2); }` will be injected into `index.css`.
