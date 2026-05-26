## Context

STL maps, sets, and vectors displayed in the visualizer sometimes show raw GDB structures or address-prefixed values (especially for `std::string` or custom structures) instead of their actual clean values. In addition, the layout of table cells within container nodes has a hardcoded pixel limit that clips the Value column. Lastly, fallback parsing in the Go backend fails to load elements when GDB MI prints them on a single line.

## Goals / Non-Goals

**Goals:**
- Sanitize map and set elements (keys and values) to print only actual clean values (strings, integers, floats, and static hex addresses for pointers) without GDB internal layout structures or wrapper types.
- Support single-line GDB MI outputs in the Go debugger's fallback `parseSTLOutput` function without crashing or losing container contents.
- Expand node dimensions to 300px width for STL containers and configure percentage-based table cell widths (50% each) to eliminate Value column clipping.

**Non-Goals:**
- Generating pointer edges/links from map/set element values (pointer values in maps will remain as plain text hex strings).
- Modifying visual representation of non-STL structs or other structural data types.

## Decisions

### Decision 1: GDB Value Stringifier Helper in python
We will implement a helper `clean_gdb_value(val)` in `stl_printers.py` that:
- Inspects the value's base type (stripping typedefs and references).
- Attempts to query the GDB pretty visualizer: if a visualizer with `to_string()` is found, we evaluate it. If the result is a `gdb.Value` (like a `char*`), we call `.string()` to retrieve the clean string representation.
- Safely converts character pointers (`char*`, `const char*`) directly using `.string()`.
- Falls back to `str(val)` for primitives and other objects.
- All printer and local variable extraction commands in `stl_printers.py` will use `clean_gdb_value` instead of raw `str(val)`.

### Decision 2: Bracket/Quote-Aware Fallback Parser in Go
We will update `parseSTLOutput` in `gdb.go` to:
- Detect the presence of summary headers like ` = {` and strip them along with outer curly braces.
- If the output block is a single-line string, split by commas while ignoring commas nested inside quoted string literals or bracket boundaries.

### Decision 3: expanded Layout Dimensions for STL Nodes
In `MemoryCanvas.tsx`, we will specify a node width of `300` and height of `150` for `category === 'stl'` nodes during layout calculation with Dagre, ensuring React Flow positions neighboring nodes with enough gap.

### Decision 4: Responsive Column Widths via CSS
In `index.css`, we will replace hardcoded pixel widths (`max-width: 100px` / `max-width: 120px`) on `.stl-map-cell-key` and `.stl-map-cell-value` with percentage-based widths (`width: 50%; max-width: 150px;`) and align headers with table columns.

## Risks / Trade-offs

- **[Risk]** Large strings or complex structures in maps might stretch cells vertically if they are long.
  → **Mitigation**: Standard CSS text-overflow rules with ellipsis and `white-space: nowrap` are active to prevent cell text wrapping, keeping rows uniform.
- **[Risk]** Single-line parser might have edge cases for highly complex template signatures containing unescaped characters.
  → **Mitigation**: The primary pipeline utilizes GDB Python pretty visualizers which output clean JSON. The Go parser acts as a robust fallback.
