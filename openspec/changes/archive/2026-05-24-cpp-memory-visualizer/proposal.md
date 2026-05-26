## Why

Debugging C++ memory issues and understanding data structures is incredibly difficult due to the lack of visual tools that show runtime state. Current tools like GDB provide text-based state, which is hard for users to mentally map to graphs or trees. Building an interactive C++ memory visualization platform will allow users to step through code execution and visually see the stack, heap allocations, and data structures (including STL containers) in real time.

## What Changes

- Implement a Go backend that manages a secure sandbox (e.g., gVisor) to compile and execute C++ code.
- Integrate the Go backend with a debugger (GDB or LLDB) utilizing its Python API to extract memory state via pretty-printers for both primitive types and STL containers.
- Create a WebSocket server to stream execution state snapshots to the frontend.
- Build a React/TypeScript frontend featuring a split-pane layout with a Monaco editor for C++ code and a D3.js/React Flow canvas for memory visualization.
- Implement a time-travel debugging feature on the frontend using state caching to allow users to step forwards and backwards instantly without reverse-debugging overhead.

## Capabilities

### New Capabilities
- `execution-sandbox`: Securely compiles and executes user C++ code in isolated environments.
- `debugger-integration`: Intercepts debugger state using Python API pretty-printers to generate structural JSON payloads for memory.
- `websocket-protocol`: Defines the snapshot-based WebSocket communication contract between frontend and backend.
- `memory-visualization-ui`: The frontend React component that maps JSON memory payloads into visual graphs and timelines.

### Modified Capabilities

## Impact

- Introduces a new set of Go services for the backend execution engine.
- Introduces a new React frontend application.
- Requires setup of isolated execution environments (e.g., Docker/gVisor).
