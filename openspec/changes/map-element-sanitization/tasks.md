## 1. Backend Implementation

- [x] 1.1 Add the `clean_gdb_value(val)` helper function to `backend/scripts/stl_printers.py`
- [x] 1.2 Update GDB value stringification calls in `stl_printers.py` (flatten_stl_container, extract functions, capture_locals) to use `clean_gdb_value`
- [x] 1.3 Update `parseSTLOutput` in `backend/internal/debugger/gdb.go` to strip headers and brackets from fallback single-line GDB MI outputs
- [x] 1.4 Implement a quote-aware, bracket-aware comma-separated splitter inside `parseSTLOutput` in `gdb.go` to parse single-line output values

## 2. Frontend Implementation

- [x] 2.1 Increase STL container node dimensions to width 300 and height 150 in `frontend/src/components/MemoryCanvas.tsx` layout code
- [x] 2.2 Update `.stl-map-cell-key` and `.stl-map-cell-value` styles to 50% width and 150px max-width in `frontend/src/index.css`
- [x] 2.3 Align table header cells `.stl-map-header-key` and `.stl-map-header-value` with table columns and align cell/header text

## 3. Verification

- [ ] 3.1 Verify C++ debugging step execution and data extraction using std::map with std::string and pointer types
- [ ] 3.2 Verify visual layout correctness of map table keys, values, and columns on the React Flow canvas
