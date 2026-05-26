## Why
The visualizer is experiencing deep synchronization issues with GDB. When the user clicks "Step", GDB instantly returns `^running... (gdb)`, and then slightly later returns `*stopped... (gdb)`. Our backend was only waiting for the first `(gdb)` prompt, meaning it mistakenly thought execution was finished while it was still running, leading to out-of-sync commands and corrupted JSON snapshots that leaked `libc` teardown frames. 

Additionally, the frontend React nodes are crashing and hiding variables because an index variable (`i`) was removed from a `.map()` callback, causing the pointer `<Handle>` layout to break on any variable after the first.

## What Changes

1. **GDB Execution Synchronization (Backend)**:
- We will modify `gdb.go` so that execution commands (`-exec-run`, `-exec-next`) explicitly wait for the `*stopped` async record before proceeding. This guarantees we capture the true post-step state and ensures our `containsAny` library blacklist functions flawlessly.

2. **React Handle Restabilization (Frontend)**:
- In `MemoryNode.tsx`, we will restore the `i: number` index argument to the `variables.map` callback. While the `key` will safely remain `v.name`, the index `i` is strictly required to calculate the `top` CSS offset for the pointer Handles.

3. **Restoring Default Include (Frontend)**:
- Per user request, we will restore `#include <iostream>` to the default code in `CodeEditor.tsx` so users can utilize `std::cout`.

## Capabilities

### Modified Capabilities
- `debugger-integration`: GDB interaction explicitly consumes streams until `*stopped` is reached.
- `memory-visualization-ui`: React components render without ReferenceErrors, and the default editor code has expected includes.

## Impact
- **Backend**: The stepping flow becomes mathematically deterministic, permanently preventing out-of-sync command pollution.
- **Frontend**: All variables will render cleanly with their handles perfectly positioned.
