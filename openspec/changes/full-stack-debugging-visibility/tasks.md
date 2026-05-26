## 1. Backend Filtering & Logging

- [x] 1.1 In `backend/internal/debugger/gdb.go`, verify and strictly enforce that any stack frame not in `main.cpp` (or dropping into `_start`/`??`) causes the debugger to halt and return "program finished".
- [x] 1.2 In `backend/internal/handler/websocket.go`, add a log statement to print out the raw JSON payload of the `SnapshotMessage` immediately before it is sent over the socket.

## 2. Frontend Node Identity

- [x] 2.1 In `frontend/src/utils/canvas.ts`, refactor `generateNodes` to use stable, predictable strings for the `id` field of React Flow nodes. For locals, use `stack-${frameIndex}-${local.Name}`. For heap, use `heap-${obj.Address}`.

## 3. Frontend Debug UI

- [x] 3.1 Create a new component `frontend/src/components/DebugPanel.tsx` that receives the current `Snapshot` and displays its JSON in a `<pre>` block inside a collapsible UI.
- [x] 3.2 Integrate `<DebugPanel currentSnapshot={currentSnapshot} />` into the main application layout in `frontend/src/App.tsx`.
