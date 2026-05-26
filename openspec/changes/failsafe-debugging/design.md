## Context
We identified a race condition in the GDB Machine Interface (MI) parsing. GDB responds to execution commands with two prompts: one after `^running` and another after `*stopped`. By stopping at the first prompt, the backend fed out-of-order commands to GDB.

## Decisions
1. **`consumeUntilStopped()`**: In `gdb.go`, we will add a new helper function `consumeUntilStopped()` specifically for `-exec-run` and `-exec-next`. It will continuously read lines until it finds a line starting with `*stopped`, and *then* wait for the immediate `(gdb)` prompt that follows it.
2. **React Key/Index**: `MemoryNode.tsx` needs the map index to stack the pointer output handles cleanly vertically. We'll use `variables.map((v: Variable, i: number)` and `top: \`${50 + i * 32}px\``.
3. **`DEFAULT_CODE`**: We revert the default code snippet in `CodeEditor.tsx` to include `<iostream>` and a `std::cout` statement.
