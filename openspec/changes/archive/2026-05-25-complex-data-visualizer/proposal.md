## Why
The visualizer currently drops variables from its display due to a parser flaw, leading to the impression that the visualizer is stuck on the first variable (`a=10`). Furthermore, the backend struggles to dynamically visualize complex data structures (like linked lists and trees) because the current JSON snapshot format lacks structural typing and pointer linking. Finally, the "garbage" values you see (e.g., `29790`) are technically accurate C++ behaviors for variables that have an assignment *later* in the scope, but we must make the UI display them cleanly.

## What Changes

1. **Flawless MI Parsing (Backend)**:
- The backend `parseLocals` method currently only searches for the *first* occurrence of `name`, `type`, and `value` on a line, completely ignoring the rest of the `locals=[...]` list array. We will replace this with a strict Regex matcher (`regexp.MustCompile`) that captures every single local variable.

2. **Pointer & Complex Structure Tracking (Backend & Frontend)**:
- We will expand `gdb.go` to recognize when a variable is a pointer (`*`), a tree node, or a list node. Using GDB MI's `-var-create` and `-var-list-children`, the backend will iteratively chase pointers, serialize the structure, and return it in a new `advancedData` JSON payload. 
- The frontend `MemoryCanvas` will parse these pointers and render dynamic SVG edges linking the memory nodes together.

3. **Garbage Value Explanation / Mitigation**:
- `gcc`'s `-ftrivial-auto-var-init=zero` strictly zeroes variables that are *never* initialized. However, if a variable has an explicit assignment (like `int a = 10;`), GCC intentionally skips auto-init for performance, causing GDB to see garbage before the execution hits that line. We will ensure the timeline visually distinguishes lines before they execute, so the user understands *why* it holds a raw stack value.

## Capabilities

### Modified Capabilities
- `debugger-integration`: Robust Regex parsing and pointer-chasing logic for structures.
- `memory-visualization-ui`: Node linking via React Flow edges for complex graphs.

## Impact
- All declared variables will correctly transition through all execution steps.
- Linked lists and trees will render as beautiful, interactive memory graphs.
