## Why

When debugging C++ code with `std::map` or `std::pair`, the visualizer renders each container as a single isolated box with a static HTML table inside. The table is disconnected from the rest of the graph — no arrow from stack variable to heap representation, no connections between key-value pairs, no edges to actual memory addresses. Floating blocks with no visual relationships make it hard to trace "what points to what," which is the core value of a graph visualizer.

The backend (Python `flatten_stl_container`) already extracts per-element hex addresses for both maps and pairs. This data exists in the snapshot JSON but is discarded by the frontend because (1) the TypeScript `STLElement` interface lacks an `address` field, and (2) `buildNodesAndEdges()` creates sub-nodes and edges from struct fields but not from STL elements.

## What Changes

1. Add optional `address` field to the TypeScript `STLElement` interface
2. Promote map/pair elements from table rows to standalone React Flow sub-nodes (up to 50 elements)
3. Create edges from container → element sub-nodes and element sub-nodes → memory addresses
4. Implement deterministic grid layout for sub-nodes below the parent
5. Add bundled smoothstep edge routing to prevent visual spaghetti
6. Integrate sub-nodes with the existing collapse/expand system
7. Investigate and fix the stack→heap edge for STL types (potential Go backend double-indirection bug)
8. Keep table rendering for maps exceeding 50 elements and for non-associative containers (vector, set)

## Capabilities

### New Capabilities
- `map-element-graph`: Renders `std::map` and `std::pair` elements as connected sub-nodes in the visualization graph with edges, grid layout, and bundled routing

### Modified Capabilities
- `memory-visualization-ui`: The STL Content Visibility requirement will be modified to specify that map/pair elements render as connected graph nodes (not just table rows) and that collapse/expand controls show/hide sub-nodes

## Impact

- **frontend/src/types.ts**: Add `address` field to `STLElement` interface
- **frontend/src/components/MemoryCanvas.tsx**: Extend `buildNodesAndEdges()` to create sub-nodes and edges from STL elements; add grid layout and bundled edge routing
- **frontend/src/components/MemoryNode.tsx**: Add `stl-element` node category with mini two-field rendering
- **frontend/src/index.css**: Add styles for `stl-element` nodes
- **backend/internal/debugger/gdb.go** (conditional): Fix potential double-indirection bug in `dereferencePointer` format string if investigation confirms it
