## 1. Flattening the Graph Topology

- [x] 1.1 In `backend/scripts/stl_printers.py`, modify `_extract_tree` and `_extract_list` to stop recursing into children, and instead just assign `data["left"] = {"address": str(left_ptr)}`.
- [x] 1.2 In `backend/internal/debugger/gdb.go`, modify `chaseNodePointers` to return `[]HeapObject`. Append all discovered children, and their children recursively, to this slice.
- [x] 1.3 In `backend/internal/debugger/gdb.go`, modify `extractHeapObjects` to append the slice returned by `chaseNodePointers` to the main `heapObjects` array.

## 2. Expanded STL Coverage

- [x] 2.1 In `backend/scripts/stl_printers.py`, add support for `std::stack`, `std::queue`, `std::priority_queue`, and `std::pair` in the `_extract` multiplexer. 

## 3. Snippets UI

- [x] 3.1 In `frontend/src/components/CodeEditor.tsx`, define a constant dictionary of C++ snippets (Linked List, Binary Tree, Vector, Stack).
- [x] 3.2 In `frontend/src/components/CodeEditor.tsx`, add a dropdown select menu above the editor to inject these snippets into the editor state.
