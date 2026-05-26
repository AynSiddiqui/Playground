## Why

Currently, visualizer nodes for C++ maps and STL containers suffer from representation and layout bugs:
1. STL map elements display raw GDB value representations (such as internal C++ templates or pointer address prefixes like `0x5555555662c0 "apple"`) in their Key columns, instead of clean actual values.
2. In fallback single-line GDB output, parse errors prevent any container elements from loading because the Go parsing code splits only by newline and is confused by GDB MI summaries.
3. STL container node table bodies are clipped horizontally on the React Flow canvas (the Value column disappears) because table paddings exceed the layout bounds of the nodes.

## What Changes

1. **Map Element Sanitization**: Use Python pretty-printer visualizers to extract clean string and value details in `stl_printers.py`, stripping GDB internal struct details.
2. **Go Single-line Parser Failsafe**: Update `parseSTLOutput` in `gdb.go` to strip console headers/braces and parse comma-separated lists of elements on single lines using a quote-aware parser.
3. **Frontend Layout Expansion**: Assign a larger node width of 300px for STL container heap nodes (up from 220px) in the layout computation in `MemoryCanvas.tsx`.
4. **Percentage-based Columns**: Update index.css to set map cell widths to 50% with max-width 150px, aligning header text and data columns.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `memory-visualization-ui`: The user interface requirements are updated to support correct representation of map element key/value data and responsive layout adjustments to prevent cell clipping.

## Impact

- **Backend**:
  - `backend/scripts/stl_printers.py` (Add clean_gdb_value and update GDB string stringifiers)
  - `backend/internal/debugger/gdb.go` (Update parseSTLOutput fallback logic)
- **Frontend**:
  - `frontend/src/components/MemoryCanvas.tsx` (Increase layout width for STL container nodes)
  - `frontend/src/index.css` (Style .stl-map-cell-key and value cells with width: 50% and max-width: 150px)
