## Why

Two parallel data sources — `structuralLinks` (from Python backend) and `heap[].fields` (from Go backend) — supply conflicting data for the same memory nodes. The frontend's `buildNodesAndEdges` has no clear winner, causing: dynamically created nodes to miss their value fields, pointer Handles to disappear, duplicate overlapping arrows, and structural metadata to be silently overwritten. A single authoritative data source is needed.

## What Changes

1. **StructuralLinks become the canonical source** for all linked-list and binary-tree nodes. The stack-loop structural processing (Pass 1 + Pass 2) is the sole creator of structural nodes, edges, and variable bindings.
2. **Heap loop no longer processes structural nodes**. The heap loop skips nodes that were already created by structural links — it only pushes nodes for non-structural heap objects (STL containers, matrices, plain structs).
3. **Heap field edges skip structural pointer fields**. Fields like `next`, `prev`, `left`, `right` are already connected by structural-link edges; heap field edges for these names are suppressed to prevent duplicate arrows.
4. **Dynamically created nodes carry full metadata**. Nodes created in Pass 1 include `advancedData` and all pointer fields as variables, guaranteeing Handles render for every connection.

## Capabilities

### New Capabilities
- *(none — this refines existing capability)*

### Modified Capabilities
- `memory-visualization-ui`: The graph builder's data-source priority changes from "heap fields win" to "structuralLinks win." Heap nodes and structural link nodes for the same address are unified rather than duplicated. Structural pointer fields always appear as variables with Handles.

## Impact

- **Frontend** (`MemoryCanvas.tsx`): The heap structural processing loops (Pass 1/Pass 2) are removed or gated. The edge deduplication logic is added to the heap field edge loop. Node creation in structural Pass 1 includes `advancedData`.
- **Backend**: No changes — the data source authority change is purely frontend-side.
- **No breaking changes**: All existing snapshot data continues to work.
