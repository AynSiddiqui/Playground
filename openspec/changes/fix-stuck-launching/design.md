## Context

The backend execution environment for the C++ memory visualizer uses a WebSocket server and invokes GDB to run the compiled binaries. Currently, the `gdb.go` debugger wrapper reads stdout and stderr using blocking mechanisms that expect EOF, which GDB never sends because it is an interactive session. This causes the backend to hang, leaving the frontend stuck in a "Launching" state. Additionally, there is no handshake protocol for successful launches or compilation errors, forcing the frontend to guess whether the launch failed.

## Goals / Non-Goals

**Goals:**
- Implement asynchronous, non-blocking stream reading for GDB output using `bufio.Scanner` in goroutines.
- Detect the `(gdb)` prompt to correctly synchronize command execution and state retrieval.
- Define explicit `LAUNCH_SUCCESS` and `ERROR` WebSocket events to control the frontend state machine.
- Implement a 10-second failsafe timeout on the frontend for the "Launching" state.
- Add granular console logging to the backend for observability during the compile/launch phase.

**Non-Goals:**
- Completely rewriting the underlying `gdb.go` command invocation structure.
- Changing the Docker sandbox constraints (they were just implemented and work fine).
- Refactoring the frontend React Flow visualization logic.

## Decisions

**1. Asynchronous Stream Reading**
Instead of `cmd.CombinedOutput()` or `ioutil.ReadAll` which block until EOF, we will use `bufio.NewScanner` on `stdout` attached via pipes. A loop will read lines continuously until it encounters `(gdb)` or `^done` (MI record), signaling the command is complete. This prevents the Go server from hanging.

**2. WebSocket Handshake Protocol**
The WebSocket connection will transition to a formalized handshake:
- `{"event": "status", "state": "launching"}`: Compilation started.
- `{"event": "LAUNCH_SUCCESS"}`: The container is running, GDB is attached, and breakpoint hit at `main`.
- `{"event": "error", "message": "..."}`: Compilation failed or container crashed.

**3. Frontend 10-Second Failsafe Timeout**
The React client (`useWebSocket.ts` or `App.tsx`) will set a `setTimeout` of 10000ms upon sending the `start` command. If the timeout triggers before `LAUNCH_SUCCESS` or `ERROR` is received, it will forcefully set the state to `error` and disconnect the socket to prevent the UI from deadlocking.

## Risks / Trade-offs

- **Risk**: GDB output might occasionally split the `(gdb)` prompt across chunks if read raw. 
  **Mitigation**: Using `bufio.Scanner` with `.Scan()` reads line-by-line, which naturally handles line buffering.
- **Risk**: The 10-second timeout might be too short on slower systems when Docker is pulling an image.
  **Mitigation**: Docker images (like `cppviz-runner`) are expected to be pulled locally beforehand. 10 seconds is more than enough for a standard compilation and launch.
