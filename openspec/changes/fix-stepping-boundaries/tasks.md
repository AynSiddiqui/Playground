## 1. Sandbox Execution Boundary Logic

- [x] 1.1 In `backend/internal/debugger/gdb.go` within the `Step()` function, add an execution boundary check right after retrieving `output := g.consumeUntilPrompt()`.
- [x] 1.2 The boundary check should test if the output contains `func="??"` or `func="__libc_start_main"`. If so, set `g.running = false` and return `nil, fmt.Errorf("program finished")` exactly like the standard exit condition.

## 2. Clean Default Code Initialization

- [x] 2.1 In `frontend/src/components/CodeEditor.tsx`, update the `DEFAULT_CODE` example to explicitly initialize the primitive variables to `0` at their declaration lines, so the very first step does not show garbage values.
