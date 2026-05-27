## Why

During range-based `for` loop executions or general C++ debugger steps, the memory visualizer displays internal compiler-generated variables (such as `__for_range`, `__for_begin`, `__for_end`) which clutter the stack frame. Furthermore, when evaluating the memory addresses of reference types (e.g. `std::pair<...>&`), the Go debugger backend appends a `*` directly to the type string resulting in `T&*`, which GDB cannot resolve (raising `Attempt to take address of value not located in memory` errors). This prevents reference pointers from binding and linking stack loop variables to their heap target objects.

## What Changes

- Filter out stack variables starting with double underscores `__` (representing compiler internals/sentinels) in the `parseLocals` method.
- Update `extractHeapObjects` to inspect if a variable's type ends with `&` (reference). If so, strip the reference symbol and append `*` to form `T*` instead of `T&*` so GDB can resolve it properly.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This is a debugger-pipeline serialization bug fix.

## Impact

- **Code Affected**: `backend/internal/debugger/gdb.go`
- **APIs**: Excludes internal variables from `locals` array and properly populates `address` for references in the snapshot output.
- **Systems**: Stack/Heap memory graph linking in the frontend visualization.
