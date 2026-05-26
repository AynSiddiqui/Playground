## 1. Backend GDB Synchronization

- [x] 1.1 In `backend/internal/debugger/gdb.go`, implement a `consumeUntilStopped()` method that loops `consumeUntilPrompt()` until the accumulated lines contain a string prefix matching `*stopped`. 
- [x] 1.2 In `backend/internal/debugger/gdb.go`, update `Start()` to use `consumeUntilStopped()` after `-exec-run`.
- [x] 1.3 In `backend/internal/debugger/gdb.go`, update `Step()` to use `consumeUntilStopped()` after `-exec-next`.

## 2. Frontend React Fix

- [x] 2.1 In `frontend/src/components/MemoryNode.tsx`, restore the `i: number` argument to `variables.map` so that pointer handles can calculate their CSS `top` property without throwing ReferenceErrors.

## 3. Frontend Code Snippet

- [x] 3.1 In `frontend/src/components/CodeEditor.tsx`, update `DEFAULT_CODE` to re-include `#include <iostream>` and print a variable using `std::cout`.
