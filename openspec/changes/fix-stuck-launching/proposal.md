## Why

Currently, the Memory Visualizer UI often gets stuck in a "Launching" state. This happens because the Golang backend's debugger execution wrapper (`gdb.go`) uses blocking reads on the Docker/GDB standard output/error, waiting for EOFs that don't arrive. Furthermore, the WebSocket protocol lacks a definitive initialization handshake, so the frontend waits indefinitely if something goes wrong. Fixing this is essential to provide a responsive, robust developer experience that clearly communicates errors instead of hanging indefinitely.

## What Changes

- Rewrite the GDB backend execution wrapper to use asynchronous, non-blocking stream reading (via goroutines and `bufio.Scanner`).
- Implement detection of the `(gdb)` prompt to determine debugger readiness.
- Add comprehensive verbose logging in the Go backend to make execution stages explicitly visible in the terminal.
- Introduce explicit WebSocket handshake events: `LAUNCH_SUCCESS` when the debugger successfully halts at `main`, and `ERROR` if compilation/execution fails.
- Update the React frontend to clear the "Launching" state upon receiving `LAUNCH_SUCCESS`.
- Implement a 10-second client-side timeout in the frontend's "Launching" state that aborts the process and unlocks the UI if the backend hangs.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `debugger-integration`: The `Debugger` interface implementation needs to switch from blocking I/O to asynchronous prompt-based I/O reading.
- `websocket-protocol`: The protocol needs to mandate `LAUNCH_SUCCESS` on successful launch and `ERROR` on failure, and require the client to enforce a timeout.

## Impact

- **Backend**: `gdb.go` and `websocket.go` (and associated event schemas).
- **Frontend**: `useWebSocket.ts` and UI state logic handling the run/launch states.
