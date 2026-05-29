## 1. Backend GDB Debugger Safety Fixes

- [x] 1.1 Add `is_valid_vector` helper to validate internal vector pointers in `backend/scripts/stl_printers.py`
- [x] 1.2 Skip uninitialized local variables in `_capture_locals` using `sal.line` and `sym.line` comparison
- [x] 1.3 Update `flatten_stl_container` to resolve adapters first and validate vector layouts
- [x] 1.4 Update `_extract_adapter` and `_extract_vector` in `backend/scripts/stl_printers.py` to validate layouts

## 2. Frontend Memory Canvas Viewport Controls

- [x] 2.1 Import `useReactFlow` hook in `frontend/src/components/MemoryCanvas.tsx`
- [x] 2.2 Add `handleCenterView` using `fitView({ duration: 400, padding: 0.2 })` in `MemoryCanvas.tsx`
- [x] 2.3 Render a "Center View" button in `MemoryCanvas.tsx` Panel controls
- [x] 2.4 Add CSS styles for `.edge-style-btn--center` and its hover state in `frontend/src/index.css`
