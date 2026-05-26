## Context
To make the visualization experience robust for beginners, we must hide the complexities of C++ stack memory (garbage initialization) and prevent any edge-case bleed into standard library binaries.

## Decisions

1. **`-ftrivial-auto-var-init=zero`**: Instead of writing complex frontend heuristics to guess if a variable is initialized, we leverage a modern GCC 12+ feature. By passing `-ftrivial-auto-var-init=zero` in `sandbox.go`, all stack memory is wiped clean, and `int a;` will reliably show as `0` instead of a memory address leftover.
2. **Boundary Condition**: In `gdb.go`, we will append `from="/lib/` to our `containsAny` blacklist. This guarantees any drop into `libc` triggers the end of the debugging session.
3. **`DEFAULT_CODE`**: We will replace the current default code in `CodeEditor.tsx` to:
   ```cpp
   int main() {
       int a = 10;
       int b = 20;
       int c = a + b;
       return 0;
   }
   ```
