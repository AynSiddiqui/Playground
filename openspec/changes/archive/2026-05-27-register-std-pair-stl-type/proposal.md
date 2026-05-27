## Why

The backend currently fails to fetch the memory address for stack variables of type `std::pair` (such as loop iterators). This occurs because `std::pair` is not registered in the `isSTLType` list in the Go backend debugger wrapper. Without an address, these variables are completely skipped during heap object dereferencing and cannot render their `first`/`second` members.

## What Changes

- Add `"std::pair"` to the `stlPrefixes` list in `isSTLType()` inside `backend/internal/debugger/gdb.go`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None. This is a visualizer bug fix.

## Impact

- **Code Affected**: `backend/internal/debugger/gdb.go`.
- **APIs**: The Go backend will now output the proper `"address"` for `std::pair` variables in the JSON stack frame snapshot.
- **Systems**: Stack and heap visualizations of pair variables and iterators.
