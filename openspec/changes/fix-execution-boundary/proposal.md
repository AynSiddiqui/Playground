## Why
Currently, the GDB execution loop does not recognize when the user's code has finished executing. It continues to issue step commands past the end of the `main()` function, dropping into the C runtime environment (`libc.so.6`). This generates garbage stack frames with missing variable names and unmapped addresses, which corrupts the final steps of the frontend timeline and hides the actual local variables.

## What Changes
- **Execution Boundary Enforcement (Backend)**: Modify the Go GDB stepping loop to constantly check the current frame's `fullname` or `file` attribute. If the execution steps into a frame where the file is no longer the user's source code (e.g., `main.cpp`), or if it drops into a system library, the backend MUST immediately halt the stepping process and treat the previous step as the final state.
- **Payload Sanitization (Backend)**: Add a filter to the snapshot generator. It must strip out any stack frames where `func="??"` or where the origin is a system library (like `/lib/x86_64-linux-gnu/libc.so.6`).
- **Initial State Scrubbing (Frontend)**: Ensure that when the frontend receives the execution timeline, it automatically sets the playback slider to Step 1 (the first line of `main`) rather than defaulting to the end of the timeline, so the user sees the variables initialize sequentially.

## Capabilities

### Modified Capabilities
- `debugger-integration`: Update the Go stepping loop to halt on execution boundary exits (leaving user source code).
- `websocket-protocol`: Ensure the final payload timeline only contains valid user-space snapshots.
- `memory-visualization-ui`: Default the timeline scrubber to the beginning of the valid execution array rather than the end.

## Impact
- **Backend**: The `Debugger` or `Runner` Go struct will need updated regex or JSON parsing logic to read the `frame={...}` data from the `*stopped` GDB/MI event and make a halt decision before generating the next snapshot.
- **Frontend**: The `TimelineManager` or slider component will need its initial state adjusted.
