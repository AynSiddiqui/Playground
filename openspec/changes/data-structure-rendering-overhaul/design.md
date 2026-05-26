## Context
The visualizer currently mixes stack primitive values and complex heap/pointer-based data structures in a way that breaks React Flow's ability to logically lay them out. Binary Trees and Linked Lists are failing to parse correctly from GDB, resulting in malformed JSON payloads.

## Goals / Non-Goals

**Goals:**
- Successfully extract memory addresses and values for all common C++ STLs (`std::vector`, `std::map`, `std::set`, `std::list`, `std::string`) using Python GDB pretty printers.
- Extract `left`, `right`, `next`, and `prev` pointers and serialize them as distinct edges in the JSON payload.
- Separate Stack Variables (primitives) into `MemoryNode` (the Stack Frame), and Heap Variables into disjoint nodes.
- Implement Dagre.js in the React Flow frontend to lay out nodes hierarchically.

**Non-Goals:**
- We are not writing a custom debugger; we are strictly wrapping GDB MI and Python API.
- We will not support graphs with arbitrary cyclic topologies initially, only Trees, Lists, and STL containers.

## Decisions
- **Python GDB Script (`stl_printers.py`)**: We will implement custom python printers (`_extract_tree`, `_extract_list`, `_extract_stl`) that query the raw memory offsets or use GDB's native Python API `gdb.default_visualizer()` to safely unwrap nested structs and STL components. We will output flat arrays of nodes instead of deeply nested JSON to avoid React Flow nesting limitations.
- **Frontend Layout Engine**: We choose `dagrejs` because it natively handles DAG (Directed Acyclic Graph) layouts which perfectly models Trees and Lists. We will hook it into `MemoryCanvas.tsx` to automatically calculate `x/y` positions based on the extracted edges.
- **Node Identifying**: We strictly use `address` (e.g. `0x7ffffff...`) as the unique `id` for Heap Objects to enable CSS `transform` transitions.

## Risks / Trade-offs
- **GDB Versioning**: Different GCC versions pack STLs differently (e.g. `_M_impl` vs `_M_node`).
  - *Mitigation*: Fall back to primitive casting or `gdb.default_visualizer` if raw struct offsets fail.
- **Dagre Performance**: Re-calculating layout on every step could be heavy.
  - *Mitigation*: Dagre is fast enough for <100 nodes, which is within the bounds of a visualizer window.
