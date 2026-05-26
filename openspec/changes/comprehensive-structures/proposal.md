## Why
Currently, linked lists and trees are rendered as a single giant, embedded block inside their parent node because the backend Python script recursively nests the entire data structure into a single JSON object. This prevents the React Flow canvas from rendering them as "disjoint", movable nodes with proper edge connections. Additionally, users lack an easy way to load boilerplate code for complex data structures like Stacks, Queues, Vectors, and Trees to quickly test the visualizer.

## What Changes

1. **Disjoint Node Flattening (Backend)**:
- We will modify `stl_printers.py` so that `_extract_list` and `_extract_tree` no longer recursively embed their child objects. Instead, they will only capture and return the raw pointer addresses of `next`, `left`, and `right`.
- In `gdb.go`, we will update `extractHeapObjects` so that the `chaseNodePointers` helper actually returns its discovered child `HeapObject`s and flattens them into the main `heap` array. This ensures the frontend receives them as independent memory nodes.

2. **Extensive STL Support (Backend)**:
- Expand `stl_printers.py` to gracefully handle and explicitly format `std::stack`, `std::queue`, `std::priority_queue` (heap), and `std::pair`, passing their logical elements via GDB's pretty-printer API cleanly to the frontend.

3. **Code Snippets Library (Frontend)**:
- We will add a dropdown menu above the `CodeEditor` containing pre-written boilerplate snippets for all major data structures (Binary Tree, Linked List, Vector, Map, Stack, Queue, etc.). Clicking a snippet will instantly populate the editor.

## Capabilities

### Modified Capabilities
- `debugger-integration`: Flat topology graph generation and broad STL support.
- `memory-visualization-ui`: Draggable distinct nodes with an integrated Snippets library.

## Impact
- Trees and lists will render as beautiful, independent, draggable circles/boxes connected by SVG bezier curves.
- The visualizer becomes immediately accessible and educational without requiring the user to type out boilerplate class definitions.
