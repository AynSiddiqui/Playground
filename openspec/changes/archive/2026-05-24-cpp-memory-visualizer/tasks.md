## 1. Backend Infrastructure & Sandbox

- [x] 1.1 Initialize Go module and setup basic project structure
- [x] 1.2 Implement secure sandbox wrapper (e.g., using os/exec with cgroups or gVisor) for executing arbitrary binaries
- [x] 1.3 Add timeout mechanisms and resource limits for the sandbox
- [x] 1.4 Write tests to verify infinite loops are terminated safely

## 2. Debugger Integration

- [x] 2.1 Integrate Go backend with GDB/LLDB using its machine interface (MI)
- [x] 2.2 Implement a wrapper to compile C++ code with `-g -O0` flags
- [x] 2.3 Write Python API scripts/pretty-printers to intercept standard STL containers (std::vector, std::map, etc.)
- [x] 2.4 Implement Go logic to parse the pretty-printed output into the target JSON snapshot schema
- [x] 2.5 Add support for extracting local variables and stack frames at each step
- [x] 2.6 Implement logic to traverse pointers and extract reachable heap memory

## 3. WebSocket Protocol
ty
- [x] 3.1 Setup WebSocket server in the Go backend
- [x] 3.2 Define exact JSON schemas for `start`, `step`, `stop`, `status`, `error`, and `snapshot` events
- [x] 3.3 Implement message routing and connection handling on the server

## 4. Frontend Setup & Code Editor

- [x] 4.1 Initialize React/TypeScript project with Vite
- [x] 4.2 Set up the main split-pane layout
- [x] 4.3 Integrate Monaco Editor with C++ syntax highlighting
- [x] 4.4 Implement WebSocket client logic to connect to the backend

## 5. Memory Visualization UI

- [x] 5.1 Set up React Flow or D3.js canvas in the visualization pane
- [x] 5.2 Create visual nodes representing primitive variables, structs, and STL abstractions based on the snapshot JSON `isStl` flags
- [x] 5.3 Implement pointer rendering (edges connecting nodes)

## 6. Playback & State Management

- [x] 6.1 Implement the frontend cache array to store historical snapshots
- [x] 6.2 Build the timeline playback controls (Next, Previous, Reset)
- [x] 6.3 Wire the "Next" button to send a step command to the backend if at the end of the cache
- [x] 6.4 Wire the "Previous" button to instantly render the previous state from the cache
- [x] 6.5 Add editor line highlighting synchronization with the current playback step
