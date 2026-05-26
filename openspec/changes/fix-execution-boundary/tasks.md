## 1. Frontend Scrubbing
- [x] 1.1 In `frontend/src/App.tsx` (or `CodeEditor`), verify or update the logic so that when a new debugging session is started (i.e. the snapshots array is reset to the initial snapshot), the slider cleanly defaults to `0` and does not automatically fast-forward to a teardown step if it were to receive an array.

## 2. Backend Boundary Verification
- [x] 2.1 In `backend/internal/debugger/gdb.go`, ensure that the `Step()` function contains the boundary check `func="??"` and `__libc_start_main` so that the backend drops the step and returns `program finished`.
- [x] 2.2 Verify that the `SnapshotMessage` is never sent if the boundary exit is detected.
