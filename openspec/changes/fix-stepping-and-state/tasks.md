## 1. Backend GDB Fixes
- [x] 1.1 In `backend/internal/debugger/gdb.go`, modify `getFrame()` to use `-stack-select-frame %d` instead of `-stack-info-frame %d`.
- [x] 1.2 After selecting the frame, send `-stack-info-frame` to extract the metadata.

## 2. Frontend State & UI Fixes
- [x] 2.1 In `frontend/src/App.tsx`, introduce `isStepping` state.
- [x] 2.2 Update `handleNext()` to early-return if `isStepping` is true, otherwise set it to true.
- [x] 2.3 Update `handleSnapshot()` and `handleFinished()` to set `isStepping` back to false.
- [x] 2.4 Pass `isStepping` down to `PlaybackControls` and use it to disable the "Next" button.

## 3. Simplify Default Code
- [x] 3.1 In `frontend/src/components/CodeEditor.tsx`, rewrite `DEFAULT_CODE` to remove STL containers (`std::vector`, `std::map`) and only use primitive types and a basic linked list.
