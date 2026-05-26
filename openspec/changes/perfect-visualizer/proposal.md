## Why
The visualizer currently suffers from three major flaws that degrade the UX:
1. **Hidden Complex Value Types**: Variables declared on the stack (e.g., `std::vector<int> v;` or `int arr[10];`) are currently filtered out of the graph generation because the backend strictly requires them to be pointers (`isPointerType`). This forces these complex structures to render as raw, unformatted text strings clumped inside the `main` stack frame node, rather than as proper disjoint graphical structures. Simple primitives (like loop variables `i` and `j`) correctly stay in the stack frame, which is desired, but large data structures must be extracted.
2. **Missing Edge Generation**: The `MemoryCanvas` hardcodes a rule requiring the local variable's type to include `*` before it will draw an SVG edge connecting it to a heap object.
3. **Broken Editor Highlighting**: The code editor highlighting functionality silently fails to render because the CSS classes `highlighted-line` and `highlighted-glyph` do not exist in the stylesheet.

## What Changes

1. **Stack-Allocated Structure Extraction (Backend)**:
- In `stl_printers.py::_capture_locals`, we will append the memory `address` for NON-pointer value types (like arrays, structs, and STLs) so the Go backend can identify them.
- In `gdb.go::extractHeapObjects`, we will change the condition from `isPointerType(local.Type)` to checking if the local variable has a valid `Address` assigned to it (which we will now provide via python for complex types) or if it is an STL/Array type. This allows stack-allocated complex structures to be passed to `dereferencePointer` and `adv-dump`, treating them as standalone `HeapObject` nodes.

2. **Perfect Arrow Attachments (Frontend)**:
- In `MemoryCanvas.tsx`, we will remove the `.includes('*')` condition. Edges will be drawn simply by checking if `local.address` matches a generated node's address.

3. **Code Editor Styles (Frontend)**:
- In `index.css`, we will define robust `.highlighted-line` (a glowing, semi-transparent highlight) and `.highlighted-glyph` (a right-facing chevron) CSS rules to perfectly implement Monaco's line highlighting decorators.

## Capabilities
### Modified Capabilities
- `debugger-integration`: Full graphical extraction of complex stack-allocated structures.
- `memory-visualization-ui`: Reliable edge connections and perfect line-by-line editor highlighting.

## Impact
- Every data structure, regardless of whether it is a pointer or value type on the stack, will print properly as an independent graph node.
- Primitive loop variables (`int i`) will remain cleanly grouped in the stack frame.
- Stepping through the code will result in a perfectly highlighted active line in the Monaco editor.
