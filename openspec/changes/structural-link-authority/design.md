## Context

The current `buildNodesAndEdges` in `MemoryCanvas.tsx` processes structural data in two parallel paths: the stack loop (from `local.structuralLinks`) and the heap loop (from `obj.advancedData`/`obj.fields`). Both produce nodes and edges for the same addresses, but neither is the clear winner:

- **Stack structural loops** (Pass 1 + Pass 2): Create missing nodes, set variables from `structuralLinks.value`, and create edges via `addStructEdge`. But `nodes.find()` in Pass 2 misses nodes that will only be pushed later by the heap loop.
- **Heap loop**: Pushes nodes with `variables: obj.fields` (raw GDB field parse), then runs its own structural Pass 1/Pass 2 which are mostly skipped by `processedStructuralLinks`. Its field-edge loop creates duplicate edges overlapping structural link edges.

This results in missing value fields, missing Handles, duplicate arrows, and brittle rendering.

## Goals / Non-Goals

**Goals:**
- Make `structuralLinks` the sole authoritative source for linked-list and binary-tree node data
- Eliminate duplicate edge generation between structural links and heap field edges
- Guarantee all pointer fields (`next`, `prev`, `left`, `right`) appear as `variables` with Handles
- Ensure dynamically created nodes carry `advancedData` for MemoryNode rendering
- Keep heap loop functional for non-structural objects (STL containers, matrices, plain structs)

**Non-Goals:**
- No backend changes to the GDB/Python data generation
- No changes to MemoryNode.tsx component rendering
- No changes to the Dagre layout algorithm
- No changes to `processedStructuralLinks` dedup behavior (still needed for multi-frame duplicate prevention)

## Decisions

### Decision 1: StructuralLinks as canonical source

**Chosen**: Stack structural processing (Pass 1 + Pass 2) is the sole creator of structural nodes, their variables, and their edges. The heap loop's structural processing is removed entirely.

**Rationale**: `structuralLinks` from the Python backend contains the complete structure (all nodes, values, and links in one pass). The heap loop's `advancedData` is the same data but arrives per-node and second. Processing it once from the stack eliminates duplication.

**Alternative considered**: Merging both sources (union of fields) — adds complexity and the merge logic is fragile when fields conflict.

### Decision 2: Heap loop skips structural node IDs

**Chosen**: Before pushing a heap node, check if `addressToNodeId.get(addr)` already exists (created by stack Pass 1). If it does, skip the push entirely — the structural node is the canonical one.

**Rationale**: Prevents the heap node from overwriting structural variables. The structural node already has the correct `variables` array with all pointer fields.

**Alternative considered**: Pushing and then merging — requires mutating an already-pushed node, which is harder to reason about.

### Decision 3: Heap field edges skip structural pointer fields

**Chosen**: In the heap field edge loop, skip fields whose name matches known structural pointer names (`next`, `prev`, `left`, `right`). These are exclusively handled by structural link edges.

**Rationale**: Eliminates the duplicate edge problem. Structural link edges are created by `addStructEdge` with consistent styling. Heap field edges for the same connections are redundant.

**Alternative considered**: Deduplicating by sourceHandle+target — expensive and order-dependent.

### Decision 4: Dynamically created nodes carry advancedData

**Chosen**: In stack Pass 1, when creating a new node, also set `advancedData` on the node data (from `rawStackLinks`).

**Rationale**: MemoryNode's rendering block checks `advancedData.structure`. Without it, structural metadata is lost for dynamically created nodes. Setting it enables future rendering enhancements.

## Risks / Trade-offs

- **Risk**: If the Go backend sends heap objects with `fields` that contain ADDITIONAL data not in `structuralLinks.value`, those extra fields are lost (the heap node is skipped). **Mitigation**: `structuralLinks.value` already contains all non-link fields from the Python backend. The Python and Go backends inspect the same struct fields — they should agree.
- **Risk**: Multiple stack frames with overlapping structural links could still cause duplicate processing. **Mitigation**: `processedStructuralLinks` dedup still applies within the stack loop.
- **Risk**: A node that exists in `snapshot.heap` but has NO structural links (plain struct) must still render. **Mitigation**: The `if (!addressToNodeId.has(addr))` check in the heap loop only skips nodes that were already created by structural links. Plain structs pass through normally.
