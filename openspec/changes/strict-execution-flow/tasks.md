## 1. Sandbox Compilation

- [x] 1.1 In `backend/internal/sandbox/sandbox.go`, update the `g++` compilation flags to include `-ftrivial-auto-var-init=zero`.

## 2. Boundary Strictness

- [x] 2.1 In `backend/internal/debugger/gdb.go`, modify the `containsAny` blacklist check in `Step()` to include `from="/lib/"` or `from=\"/lib/` to reliably catch `libc.so` execution.

## 3. Frontend Refinement

- [x] 3.1 In `frontend/src/components/CodeEditor.tsx`, update `DEFAULT_CODE` to a simple arithmetic example without `iostream` or `cout`.
