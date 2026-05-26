## Context

Debugging C++ memory layouts and complex STL containers is highly unintuitive when relying solely on text-based debuggers like GDB or LLDB. The objective of this project is to create an interactive web application consisting of a Go backend and a React frontend to visualize execution state in real-time. The system relies on WebSockets for real-time bidirectional communication and relies heavily on debugger pretty-printers (via Python API) to translate raw memory structures into high-level logical formats suitable for frontend consumption.

## Goals / Non-Goals

**Goals:**
- Provide a robust, isolated Go backend capable of compiling and running user C++ code securely using a sandbox like gVisor or cgroups.
- Integrate with GDB/LLDB using its Python API to abstract complex C++ STL types into structured JSON payloads.
- Implement a time-travel visualization UI in React using state caching for instant backward stepping.

**Non-Goals:**
- Implementing reverse debugging on the backend (we will use frontend state caching instead).
- Visualizing arbitrarily complex non-standard user-defined data structures without custom pretty printers.
- Supporting multi-threaded C++ execution in the initial release.

## Decisions

- **State Management (Snapshots vs Deltas)**: We will use full state snapshots over delta updates.
  - *Rationale*: Frontend playback logic becomes incredibly simple `timeline[currentIndex]`. It trades off some network bandwidth for massive reduction in state sync bugs and frontend reducer complexity.
- **Debugger Abstraction**: Use GDB/LLDB Python API rather than parsing raw memory hex dumps.
  - *Rationale*: Parsing Red-Black trees (e.g. `std::map`) from raw memory is error-prone. The Python API with pretty printers can return structured key-value arrays.
- **Time Travel Architecture**: The backend only supports forward stepping. The frontend acts as a cache for historical states.
  - *Rationale*: Reverse execution in GDB (`reverse-stepi`) is notoriously slow. Keeping the history on the frontend allows instant UI updates without backend round-trips when scrubbing backwards.

## Risks / Trade-offs

- **Security Sandbox Escalation** → Mitigation: Use strict `gVisor` boundaries and strict execution timeouts (e.g., 5 seconds max) to prevent abuse from infinite loops or malicious payloads.
- **Large State Snapshots** → Mitigation: If memory payloads get too large for complex algorithms, we may cap the depth of reachable heap traversals or eventually introduce keyframe+delta optimizations later.

## Migration Plan
N/A (New application)

## Open Questions
- What specific max memory and CPU limits should be enforced in the sandbox container per session?
