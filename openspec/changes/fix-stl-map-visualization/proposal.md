## Why

1. The visualizer backend is failing to send the proper data payload for `std::map` containers when running inside the Docker sandbox because standard GDB pretty printers are not loaded/registered by default. This causes `gdb.default_visualizer()` to return `None`, yielding empty lists of elements to the frontend.
2. GDB MI evaluation commands in the Go backend fail with usage syntax errors whenever variable types contain spaces (such as `std::map<std::string, int>`), as the expressions are not wrapped in double quotes when sent over GDB MI.

## What Changes

- Modify `backend/scripts/stl_printers.py` to explicitly register `libstdc++` pretty printers from the GCC system directory on startup.
- Update `flatten_stl_container()` in `stl_printers.py` to return `None` (rather than an empty container) when pretty printers are unavailable, forcing fallback behavior.
- Modify `backend/internal/debugger/gdb.go` to wrap expression arguments in double quotes for `-data-evaluate-expression` and `adv-dump` calls.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This is a visualization-pipeline bug fix.

## Impact

- **Code Affected**: `backend/scripts/stl_printers.py`, `backend/internal/debugger/gdb.go`.
- **API/Protocol**: No schema changes, but GDB MI communication reliability is improved.
- **Systems**: Debugging session compilation & serialization inside the Docker sandbox.
