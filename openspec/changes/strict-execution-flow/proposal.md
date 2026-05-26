## Why
The visualizer currently displays large random values for variables before they are initialized (e.g., `a = 29898`) because C++ allocates raw stack memory. This causes confusion for educational purposes. Additionally, the default frontend code still contains standard I/O which clutters the interface, and the execution boundary logic needs to be completely locked down to ensure users *only* see execution inside `main.cpp`.

## What Changes

1. **Zero-Initialization Sandbox (Backend)**:
- We will modify the sandbox compilation command to include the GCC flag `-ftrivial-auto-var-init=zero`. This forces all uninitialized stack variables to default to `0`, preventing random garbage numbers from appearing in the visualizer before assignment occurs.

2. **Strict Boundary Enforcement (Backend)**:
- Enhance the GDB `Step()` function to explicitly parse the `fullname` or `from` fields of the frame. If the frame originates from `/lib/` or is no longer inside `/src/main.cpp`, execution immediately returns a "program finished" signal.

3. **Clean Default Code (Frontend)**:
- Update the default code in `CodeEditor.tsx` to completely remove `std::cout` and `<iostream>`, providing a pure arithmetic snippet that cleanly showcases stack variables without distractions.

## Capabilities

### Modified Capabilities
- `execution-sandbox`: Sandbox compilation includes `-ftrivial-auto-var-init=zero`.
- `debugger-integration`: Boundary checks aggressively look for `from="/lib/"` or `main.cpp` exit.
- `memory-visualization-ui`: The default source code is minimal and clean.

## Impact
- **Backend**: Compiles take a new flag. `gdb.go` boundary checks are broadened to catch all system library entries.
- **Frontend**: The user's first experience is a simple 5-line program where variables begin at `0` and neatly transition to their assigned values.
