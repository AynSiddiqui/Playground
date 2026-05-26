## Context

The C++ Memory Visualizer platform executes user-provided C++ code, monitors it via GDB, and renders the state visually. The current implementation uses local process execution (`os/exec` locally) which is a massive security risk, lacks support for advanced data structures (Trees, Linked Lists, Matrices), and suffers from frontend CSP `unsafe-eval` issues due to Monaco Editor's default worker configuration.

## Goals / Non-Goals

**Goals:**
- Secure the backend by isolating C++ compilation and execution inside Docker containers with strict limits (100MB RAM, no network).
- Implement robust GDB Python scripts to parse standard 2D arrays, Linked Lists, and Binary Trees.
- Enhance the React frontend to properly layout advanced structures using Dagre (for trees/graphs) and CSS Grids (for matrices).
- Completely eliminate `unsafe-eval` CSP violations in the frontend.

**Non-Goals:**
- Multi-threaded or concurrent C++ program visualization.
- Support for non-C++ languages.
- Reverse debugging (stepping backwards via the backend process rather than the frontend cache).

## Decisions

### 1. Execution Sandboxing via Docker
**Decision:** Replace the local `os/exec` compilation and execution with ephemeral Docker containers.
- **Rationale:** The Go backend will invoke `docker run --rm --memory=100m --cpus=0.5 --network=none <image>`. This provides standard, robust isolation. 
- **Alternative:** gVisor or raw cgroups. Docker provides a simpler, cross-platform dev experience while maintaining strong security.

### 2. Advanced Data Structure Detection in GDB
**Decision:** Expand `stl_printers.py` to use duck-typing heuristics to detect Trees and Linked Lists.
- **Rationale:** If a struct contains a pointer field named `next`, it's treated as a Linked List node. If it contains `left` and `right` (or similar), it's a Tree node. This allows automatic edge creation without requiring the user to use specific class names.
- **Alternative:** Require users to inherit from base classes (intrusive and ruins the raw C++ learning experience).

### 3. Frontend Layouts via Dagre
**Decision:** Integrate the `dagre` library with React Flow to compute hierarchical layouts.
- **Rationale:** Trees and Linked Lists cannot be rendered effectively with standard vertical stacking. Dagre will calculate X/Y coordinates for node-based structures to display proper flow.
- **Alternative:** Write a custom layout algorithm or use force-directed graphs (D3-force). Dagre is optimized for directed acyclic graphs and tree-like structures.

### 4. CSP Compliance & Error Handling
**Decision:** Use Vite's specific Monaco Editor plugin/worker setup to pre-build web workers, removing the need for inline blobs or `unsafe-eval`.
- **Rationale:** Modern security standards require strict CSP headers. Pre-bundling workers solves this. We will also introduce explicit `ERROR` WebSocket events so the frontend can break out of "Launching" states and display compiler logs.

## Risks / Trade-offs

- **Risk:** Docker container startup latency might make execution feel sluggish.
  - **Mitigation:** Pre-warm containers or optimize the base image (e.g., Alpine Linux with `g++` and `gdb`) to keep startup times < 1 second.
- **Risk:** Infinite loops in user code leading to runaway Docker containers.
  - **Mitigation:** Enforce a hard 3-second timeout via `context.WithTimeout` on the Go side and `--ulimit cpu=3` in Docker.
- **Risk:** Cyclic pointers (e.g., doubly linked lists or graph cycles) causing infinite recursion in the Python GDB script.
  - **Mitigation:** Track visited memory addresses in the Python script and abort traversal if a cycle is detected.
