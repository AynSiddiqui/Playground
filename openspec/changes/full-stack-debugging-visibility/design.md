## Context
We need to stabilize the debugging session completely. The UI must smoothly transition variables, hide all system garbage, and provide raw visibility into the data structures for debugging.

## Goals / Non-Goals

**Goals:**
- **Strict File Filtering**: Backend should only send snapshots if `frame.File` contains `main.cpp`.
- **Stable React Nodes**: Use `node-varName` or `node-address` for React Flow nodes instead of random/index IDs.
- **Debug UI**: Add a JSON payload viewer to the frontend.
- **Backend Logging**: Print the outbound JSON to standard out.

**Non-Goals:**
- Complex parsing of `libc.so` execution. We explicitly ignore it.

## Decisions
- **Stable Keys**: `MemoryCanvas.tsx` will map stack variables using `id: \`stack-${frameIndex}-${local.Name}\`` to ensure stable node identities across rerenders, preventing the "vanishing" effect when states change.
- **Filtering**: We will modify `gdb.go` so that if the current frame isn't in `main.cpp`, it triggers a halt.
- **Debug Panel**: A simple `<pre>` block overlay/panel in the `App.tsx` layout mapped to `currentSnapshot`.

## Risks / Trade-offs
- **Trade-off**: Filtering strictly by `main.cpp` means users can't split their code into multiple files. This is acceptable for a simple educational visualizer that only supports a single `main.cpp` upload.
