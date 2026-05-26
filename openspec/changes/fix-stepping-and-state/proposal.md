# Fix Stepping Race Conditions and State Parsing Bugs

## Problem Statement
The C++ debugger visualizer currently suffers from two major instability issues when stepping through code:
1. **Frontend Race Condition ("Spamming Next"):** The frontend sends WebSocket `step` commands without waiting for the backend to finish the previous step. This queues up multiple blocking GDB operations, causing the frontend's timeline state to permanently desync from the backend's actual execution state.
2. **Backend GDB Syntax Error:** When the backend tries to extract the call stack, it sends the command `-stack-info-frame <frameNum>`, which is invalid in GDB's Machine Interface (MI). GDB throws `^error,msg="-stack-info-frame: No arguments allowed"`, causing frame metadata (like function name and line number) to be lost.
3. **Complex Default Code:** The default C++ example includes STL containers (`std::vector`, `std::map`) which are brittle to parse with the current GDB pretty-printers. When parsing fails, the snapshot silently drops data, resulting in empty or partially rendered visualizer states.

## Capabilities

- **execution-sandbox**: 
  - **MODIFIED**: Fix the GDB frame metadata extraction to use valid MI commands (e.g. `-stack-select-frame` or `-stack-list-frames`).
- **error-handling**: 
  - **ADDED**: Introduce a frontend lock (`isStepping` state) that disables the "Next" button while a step operation is in progress over the WebSocket.
  - **MODIFIED**: Simplify the `DEFAULT_CODE` example to use only primitives and simple dynamic allocations to guarantee stable out-of-the-box functionality.

## Success Criteria
- Rapidly clicking the "Next" button does not break the UI or desync the timeline.
- The call stack correctly displays function names instead of empty frames.
- A new user opening the app sees a fully working, simplified C++ example that visualizes memory flawlessly without STL parsing crashes.
