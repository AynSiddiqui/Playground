## 1. Schema & Backend Routing
- [x] 1.1 In `backend/internal/debugger/gdb.go`, update the `Variable` struct definition to include an `Address string` JSON tag, and update `parseLocals` to extract the `address` field from the MI output regex match if present.
- [x] 1.2 In `backend/scripts/stl_printers.py::_capture_locals`, modify the logic to assign `local["address"] = str(val.address)` for STLs, Arrays, and Structs (not just pointers). Primitive types (int, float, bool) should not get an address so they stay in the stack frame.
- [x] 1.3 In `backend/internal/debugger/gdb.go::extractHeapObjects`, change the conditional check to evaluate variables if they have an `Address != ""`, rather than relying purely on `isPointerType`.

## 2. Frontend Edge Attachments
- [x] 2.1 In `frontend/src/components/MemoryCanvas.tsx`, remove `local.type.includes('*')` from the edge generation logic. Check for `local.address` existence instead.

## 3. Editor Highlighting Styles
- [x] 3.1 In `frontend/src/index.css`, append the CSS rules for `.highlighted-line` and `.highlighted-glyph` to ensure the Monaco decorations render properly on screen.
