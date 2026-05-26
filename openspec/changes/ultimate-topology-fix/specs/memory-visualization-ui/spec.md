## MODIFIED Requirements

### Requirement: Two-Pass Topological Rendering
The memory canvas builder SHALL employ a two-pass strategy for structural topologies to guarantee edge resolution.
- **Pass 1** SHALL sequentially register and create all dynamic structural nodes into the central address registry.
- **Pass 2** SHALL sequentially generate edges, strictly utilizing the fully-populated registry to guarantee that forward-pointing references are never aborted due to missing IDs.

### Requirement: Unconditional Data Display
The UI SHALL display all pointer fields (e.g., `next`, `left`) inside the node box, regardless of whether a valid SVG arrow can be drawn for them.
