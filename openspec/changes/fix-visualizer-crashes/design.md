## Context
The GDB wrapper extracts memory addresses of pointers. Sometimes, GDB appends symbol debugging information (e.g. `<malloc+514>`) directly to the address string. When we attempt to evaluate that string, GDB fails to parse it. Furthermore, if the snapshot generation fails, it sends an empty or partial JSON object to the frontend, which currently attempts an unsafe `.forEach()` call and crashes the entire UI.

## Goals / Non-Goals
**Goals:**
- Fix the GDB evaluator crash by sanitizing pointer addresses.
- Fix the frontend crash by adding default empty arrays to the snapshot parser.
- Satisfy the user's explicit request to keep Linked List nodes decoupled from the `main.cpp` stack frame node.

**Non-Goals:**
- We are not changing the core layout engine here, just fixing bugs and layout isolation logic.

## Decisions
- **Address Sanitization**: We will use `strings.Split(address, " ")[0]` in the Go backend to strip anything after the first space.
- **Null Safety**: We will use `snapshot.heap || []` and `snapshot.stack || []` in `MemoryCanvas.tsx`.
- **Node Isolation**: We will ensure the Stack node does not render child components inside itself; it merely renders a row for the pointer variable and relies on React Flow `<Edge>` to point to the distinct Heap node.
