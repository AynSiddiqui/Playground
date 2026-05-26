## Context
To make pointer-based structures (like trees and linked lists) fully movable and interactive in the React Flow canvas, every node in the structure must exist as a standalone top-level object in the JSON `heap` array.

## Decisions

1. **Python Recursion Removal**: In `stl_printers.py`, we will strip the recursive `_detect_and_extract(ptr.dereference())` calls from `_extract_list` and `_extract_tree`. We will replace them with simple address strings (e.g., `{"address": "0x123456"}`).
2. **Go Recursive Aggregation**: `gdb.go`'s `chaseNodePointers` function currently traverses the structures but fails to append the children to the root array. We will change its signature to `func (g *GDBDebugger) chaseNodePointers(obj *HeapObject, seen map[string]bool, maxDepth int) []HeapObject`, returning the flattened list of all discovered children so `extractHeapObjects` can append them.
3. **Snippets UI**: We will build a `Snippets` record object in `CodeEditor.tsx` containing C++ templates. A simple `<select>` dropdown next to the "Code Editor" title will allow users to pick a structure, which fires the `onCodeChange` callback.
4. **Editor Line Highlighting**: The Monaco `highlightLine` logic is already flawlessly hooked up to `snapshot.line`, but the UX will vastly improve once the disjoint structures are rendering correctly alongside the step execution.
