## 1. Backend Security & Sandboxing

- [x] 1.1 Add input sanitization to block malicious includes (`<cstdlib>`, `<unistd.h>`) or system calls in submitted C++ code
- [x] 1.2 Replace local `os/exec` execution in `sandbox.go` with Docker container invocation (`docker run --rm --network=none --memory=100m`)
- [x] 1.3 Ensure Docker execution successfully enforces the 3-second timeout via `context.WithTimeout`
- [x] 1.4 Broadcast explicit `ERROR` WebSocket events if compilation fails or if the Docker container crashes/times out

## 2. Advanced Data Structure Detection

- [x] 2.1 Update `stl_printers.py` to recursively traverse standard multi-dimensional arrays (matrices)
- [x] 2.2 Update `stl_printers.py` to detect Linked Lists (via `next` pointers) and safely trace cyclic references
- [x] 2.3 Update `stl_printers.py` to detect Binary Trees (via `left` and `right` pointers)
- [x] 2.4 Update the Go debugger parser (`gdb.go`) to serialize these new structures accurately into the JSON payload schema

## 3. Frontend Error Handling & CSP Compliance

- [x] 3.1 Update Vite build configuration (`vite.config.ts`) to pre-build Monaco Editor web workers, eliminating the need for `unsafe-eval`
- [x] 3.2 Implement a robust `ERROR` event listener in `useWebSocket.ts`
- [x] 3.3 Update the frontend UI to gracefully abort the "Launching" state and display the server-provided compiler or runtime errors

## 4. Frontend Layout Engines

- [x] 4.1 Install the `dagre` library (`npm install @dagrejs/dagre`) for hierarchical layout computing
- [x] 4.2 Update `snapshotToGraph` in `MemoryCanvas.tsx` to utilize Dagre to compute X/Y coordinates for Tree and Linked List nodes
- [x] 4.3 Update `MemoryNode.tsx` to render 2D arrays neatly using internal CSS Grids instead of vertical lists
- [x] 4.4 Verify all edges and pointer arrows correctly attach to the new dynamically positioned Dagre layout nodes
