## Why

The C++ Memory Visualizer currently lacks robust security controls and fails to support advanced data structures like trees and matrices. In an environment where arbitrary C++ code is executed on the backend, a strict sandbox is paramount to prevent malicious activity. Furthermore, fixing current CSP and "Stuck on Launching" bugs on the frontend, alongside extending support for linked lists and trees, will massively improve the reliability and educational value of the platform.

## What Changes

- **Frontend Integrity**: Fix the Content Security Policy (CSP) `unsafe-eval` error to ensure Monaco Editor and bundler strictly comply with secure CSP headers.
- **Robust Error Handling**: Handle compilation errors and runtime crashes gracefully by broadcasting an `ERROR` event to the frontend rather than hanging on "Launching".
- **Strict Execution Sandbox**: Replace the current basic process execution with a strict, isolated Docker container environment enforcing a 100MB RAM limit, 3-second timeout, and zero network access.
- **Input Sanitization**: Block unauthorized system calls or filesystem access from the submitted C++ code.
- **Advanced Pretty Printers**: Expand the Python GDB/LLDB wrapper to intercept and parse advanced data structures including 2D arrays (matrices), Linked Lists, and Trees.
- **Advanced Layouts**: Update the React Flow canvas to dynamically utilize appropriate layouts (e.g., grids for 2D arrays, Dagre/force-directed layouts for trees and graphs).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `execution-sandbox`: Enforce strict Docker-based containerization, 100MB memory limits, 3s execution timeout, disabled network access, and input sanitization.
- `debugger-integration`: Expand pretty-printers to detect, parse, and output standard 2D arrays, Linked Lists (`next` pointers), and Trees (`left`/`right` pointers).
- `websocket-protocol`: Update JSON schema to support error events and the new structured representations of matrices, trees, and linked lists.
- `memory-visualization-ui`: Fix CSP `unsafe-eval` issues, resolve the "Stuck on Launching" execution bug, and implement advanced rendering layouts (grid, Dagre) for complex data structures.

## Impact

- **Backend**: The `sandbox` package will require Docker integration or another strictly locked down container runtime. The `debugger` package will require enhanced Python scripts.
- **Frontend**: The `MemoryCanvas` and `useWebSocket` hooks will be significantly updated to handle new payload structures and errors. Build configuration will need to be hardened to meet strict CSP rules.
- **Infrastructure**: A Docker daemon must be accessible by the Go backend to spin up sandbox containers.
