## Why

When the user steps through a C++ program in the visualizer, reaching the end of `main()` causes GDB to step into the C Standard Library (`__libc_start_main`). Since `libc.so` lacks debugging symbols, the backend fails to parse the frame bounds and throws an error, breaking the visualization. Additionally, new users are often confused by C++'s default behavior of showing uninitialized "garbage" memory values for stack variables before they are explicitly assigned.

## What Changes

- Add a hard execution boundary in the backend. When GDB reports entering a frame without symbols (`??`) or outside of the user's source code, the debugging session will automatically stop and mark the execution as finished.
- Simplify the default C++ code example to explicitly zero-initialize variables on declaration, avoiding confusing garbage values for new users during the initial step.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `execution-sandbox`: Modify requirements to enforce execution boundary checks (preventing stepping into system libraries without symbols).

## Impact

- **Backend:** `debugger.go` / `gdb.go` snapshot building logic.
- **Frontend:** `CodeEditor.tsx` default code string.
