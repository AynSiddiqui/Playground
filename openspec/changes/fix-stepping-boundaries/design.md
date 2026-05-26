## Context
Currently, the GDB debugger in the backend blindly takes steps via `-exec-next`. When `main()` returns, it steps out of the user's codebase into the C standard library (`libc.so`). The subsequent `-stack-list-locals` command fails because `libc` is stripped of debugging symbols, crashing the snapshot generation with a `Cannot find bounds of current function` error. Furthermore, uninitialized variables correctly report garbage memory values on the first step, which confuses novice users.

## Goals / Non-Goals
**Goals:**
- Prevent GDB from executing and retrieving frames outside of the user's `main.cpp` code.
- Prevent visually disruptive errors when the program organically completes execution.
- Ensure the default code example is fully initialized and cleanly represents the visualizer's capabilities.

**Non-Goals:**
- Provide a robust variable filter UI. (This is out of scope for a quick fix, although requested as a nice-to-have, we will address it by providing clean default code).
- Intercept stepping into standard library headers *during* execution (e.g. stepping *into* `std::cout`). `-exec-next` naturally steps over them, so we only need to worry about the final `return`.

## Decisions
1. **Execution Boundary Detection:** In `gdb.go`'s `Step()` function, after `consumeUntilPrompt()`, we will check if `frame.FunctionName` is `??` or `__libc_start_main`, or if the file contains `libc.so`. If detected, we manually set `g.running = false` and return a "program finished" error, gracefully terminating the session.
2. **Clean Default Code Initialization:** We will update `DEFAULT_CODE` in `CodeEditor.tsx` to explicitly initialize variables at declaration (`int a = 0;`).

## Risks / Trade-offs
- **Risk:** Relying on `__libc_start_main` is slightly OS-specific (Linux/glibc).
  **Mitigation:** We are running the code in a strictly controlled Linux Docker container (`cppviz-runner:latest`), so the environment is perfectly deterministic and this check is safe.
