## Why
The visualizer currently renders system-level initialization/teardown frames (e.g., `_START`, `__libc_start_main`, and empty `src/main.cpp` references) which pollutes the timeline. Additionally, variables fail to update their states smoothly because the frontend lacks stable node identification across timeline steps. Finally, there is no UI visibility into the raw WebSocket payloads, making it impossible to distinguish between backend parsing errors and frontend rendering bugs.

## What Changes

1. **Strict User-Space Filtering (Backend)**:
- Modify the Go `Debugger` snapshot logic to aggressively filter stack frames. It MUST completely drop any GDB step where the frame's `func` is `??`, `_start`, or `__libc_start_main`. 
- Snapshots should ONLY be generated and broadcasted if the current execution frame is inside the user's uploaded source file (e.g., `main.cpp`). 

2. **Stable Node Identity & State Management (Frontend)**:
- Refactor the React Flow / Canvas node generation. Nodes MUST be assigned stable, predictable IDs based on their variable name (for stack locals) or memory address (for heap allocations). Do NOT use array indices for React `key` or Node `id` props.
- Ensure the frontend timeline reducer properly updates the `value` of an existing node when advancing to the next step, rather than creating duplicate or empty nodes.

3. **Raw WebSocket Debug Panel (Frontend)**:
- Create a collapsible `<DebugPanel />` component in the UI (e.g., an expandable drawer at the bottom or side of the screen).
- This panel must display the raw JSON payload of the *currently active step* in the timeline, updating in real-time as the user clicks "Next" or "Previous".

4. **Structured Backend Logging (Backend)**:
- Ensure the Go WebSocket server logs the exact JSON payload being sent to the client to stdout, enabling terminal-level verification of the sanitized data.

## Capabilities

### Modified Capabilities
- `debugger-integration`: Implement strict whitelisting for user-space source files and blacklist system runtime frames.
- `memory-visualization-ui`: Refactor node ID generation for stable state transitions across timeline steps. Implement the `<DebugPanel />` for JSON payload inspection.
- `websocket-protocol`: Ensure delta/snapshot updates carry stable identifiers (names/addresses) for all variables.

## Impact
- **Backend**: The snapshot generation loop in Go requires new conditional checks before calling `conn.WriteJSON`.
- **Frontend**: The canvas mapping functions need an overhaul to prioritize stable keys. A new React component (`DebugPanel`) will be added to the layout.
