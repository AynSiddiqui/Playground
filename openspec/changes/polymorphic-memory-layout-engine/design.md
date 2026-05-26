## Context

The debugger currently produces a flat JSON snapshot with generic variable entries. The frontend visualizes everything in a single React Flow graph — stack variables float alongside heap nodes, linked lists have no directional structure, trees lack hierarchy, and STL containers map raw internals (like `_Mypair`, `_Mytree`) directly into the graph. This makes memory state confusing for learners who need clear visual patterns: a linked list should look like a chain, a tree like a hierarchy, and an array like a grid.

## Goals / Non-Goals

**Goals:**
- Every variable/heap object in the snapshot carries a structural `type` tag (`PRIMITIVE`, `ARRAY_1D`, `MATRIX_2D`, `LINKED_LIST`, `BINARY_TREE`, `STL_CONTAINER`)
- Linked list payloads resolve a clean sequence of address-connected nodes, completely decoupled from stack metadata
- Binary tree payloads map nodes as a flat address registry with explicit `left`/`right` child links
- STL containers are flattened to pure key-value pairs or index arrays before serialization (no raw compiler metadata)
- Frontend has 4 dedicated renderers: Stack Panel (primitives + pointer addresses), Grid (arrays/matrices), Linear Chain (linked lists), Hierarchical Tree (binary trees)
- Pointer re-targeting animates smoothly via CSS transitions on SVG edges

**Non-Goals:**
- No changes to the step-execution or compiler pipeline
- No new external dependencies (Dagre is already used or available; no new npm packages)
- No changes to the time-travel snapshot cache logic
- No changes to the Monaco editor or code highlighting

## Decisions

### D1: Type-tagged snapshot schema over separate endpoints
- **Choice**: Add a required `type` field to each variable and heap entry in the existing snapshot event, plus a `links` sub-object for structural references (next/prev/left/right).
- **Rationale**: A unified, self-describing payload keeps the frontend renderer selection stateless and deterministic. Separate endpoints would require the frontend to know ahead of time what to request, doubling complexity.
- **Alternatives considered**: Two-phase ask (frontend requests type info after receiving base snapshot) — rejected because it adds latency and race conditions.

### D2: Registry-based flat node list for trees and linked lists
- **Choice**: Trees and linked lists serialize as a flat dictionary of nodes keyed by memory address, with each node containing its structural links. No nested recursive JSON (which would duplicate nodes with multiple parents).
- **Rationale**: Flat registries prevent duplication, make edge routing trivial (nodes are looked up by address), and match React Flow's node + edge data model natively.
- **Alternatives considered**: Recursive nested JSON (like `{ value: 5, left: { value: 3, ... }, right: { ... } }`) — rejected because it duplicates shared sub-trees and makes pointer aliasing impossible to represent.

### D3: Dedicated renderer components over a single configurable graph
- **Choice**: Four distinct React Flow sub-graph components (StackPanel, GridRenderer, LinearChainRenderer, HierarchicalTreeRenderer), each with its own layout algorithm and edge configuration.
- **Rationale**: A single configurable graph would accumulate conditionals for every structural type, becoming unmaintainable. Separate renderers can be developed, tested, and optimized independently.
- **Alternatives considered**: Single renderer with layout plugins — rejected due to tight coupling and testing complexity.

### D4: Dagre for hierarchical tree layout, manual layout for chains and grids
- **Choice**: Binary trees use Dagre's `TB` (top-to-bottom) layout with explicit `left`/`right` edge labels. Linked lists use fixed X-step horizontal positioning. Grids use row-major cell positioning.
- **Rationale**: Dagre handles the complexity of centering parents over children and diagonal edge routing automatically. For linear and grid structures, simple arithmetic positioning is more predictable and avoids Dagre's overhead.
- **Alternatives considered**: Dagre for all layouts — rejected because horizontal chains and grids render more cleanly with deterministic manual coordinates.

### D5: console.json dump from backend for debugging
- **Choice**: The GDB Python script prints the assembled JSON snapshot to stderr (as a single formatted line with indentation) after each step, before sending over WebSocket.
- **Rationale**: This gives developers instant visibility into the exact payload structure without needing to instrument the frontend or WebSocket traffic.
- **Alternatives considered**: Separate debug endpoint or file log — rejected because it adds complexity. stderr works seamlessly with GDB's output stream.

## Risks / Trade-offs

- **Risk**: Flat node registries increase payload size for large trees. → *Mitigation*: Trees are unlikely to exceed hundreds of nodes in a pedagogical debugger; size is acceptable.
- **Risk**: Four renderers increase frontend bundle size. → *Mitigation*: Each renderer is lazily loaded via dynamic imports, keyed by the `type` tag.
- **Risk**: GDB Python pretty printers may miss edge cases for complex STL containers (e.g., `std::unordered_map` with custom allocators). → *Mitigation*: Start with `std::vector`, `std::map`, `std::set`; add others incrementally. Fall back to `STL_CONTAINER` with raw children for unsupported types.
- **Trade-off**: Strict type tagging increases backend complexity but dramatically simplifies frontend rendering. This is a deliberate shift of complexity toward the backend where it is easier to test and maintain.
