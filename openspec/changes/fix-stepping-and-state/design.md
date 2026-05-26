## Context
The application is experiencing two bugs during debugging sessions:
1. Rapidly clicking "Next" queues up multiple WebSocket `-exec-next` requests. Since GDB runs synchronously per command, this overwhelms the backend and causes the frontend "Time Machine" state to desynchronize.
2. The GDB MI command `-stack-info-frame %d` throws an error because it does not accept arguments. This prevents the backend from correctly parsing frame metadata (line number, function name).
3. The default code uses `std::vector` and `std::map`, which can crash the GDB Python pretty printers or timeout when being evaluated dynamically.

## Decisions
- **Frontend Step Locking**: We will add an `isStepping` state to `App.tsx` that is set to `true` when `sendStep()` is called, and `false` when a snapshot arrives. The `PlaybackControls` "Next" button will be visually disabled while `isStepping` is true.
- **Backend GDB Frame Parsing**: In `gdb.go`, we will use `-stack-select-frame %d` followed by `-stack-info-frame` (without arguments) to fetch the correct frame information.
- **Default Code Simplification**: We will update `DEFAULT_CODE` in `CodeEditor.tsx` to just use primitive types (`int`, `double`) and a basic linked list, stripping out STL containers to guarantee stable out-of-the-box execution.

## Migration Plan
No database migrations. Just deploy updated frontend and backend.
