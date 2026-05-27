## Context

STL containers evaluated by GDB output extremely verbose C++ template signatures containing multiple internal allocators and comparators. This causes nodes on the React Flow canvas to stretch horizontally, breaking layout bounds. Additionally, large tables of container elements take up extensive vertical space and cannot currently be collapsed.

## Goals / Non-Goals

**Goals:**
- Parse complex GDB template type signatures into clean, short type labels.
- Support collapsible node headers for STL containers, toggled via a header arrow button.
- Persist expand/collapse state when stepping through line snapshots in the timeline.
- Render map/set elements inside tables with Key/Value column headers.

**Non-Goals:**
- Modifying backend visualizer Python scripts.
- Modifying pointer arrow generation from map row cells (pointers in map values will render as text addresses).

## Decisions

### Decision 1: Nested-Bracket Tokenizer Type Cleaner
We will implement a client-side tokenizer `getCleanSTLTypeName` in `MemoryCanvas.tsx`. It will:
- Clean up standard string signatures: `std::basic_string<char...>` $\rightarrow$ `std::string`.
- Scan parameters at depth 0 (nested bracket matching) to extract only the first two parameters for maps (Key, Value) and the first parameter for sets/vectors, stripping standard allocators and comparators.
- Render the full type signature on hover via the browser `title` attribute.

### Decision 2: Persistent Collapse State Tracking in MemoryCanvas
Instead of local `useState` in individual nodes (which gets destroyed when the React Flow node instances are re-created on snapshot changes), we will store a set of collapsed node IDs in `MemoryCanvas.tsx` state:
```typescript
const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
```
When building nodes, we pass `isCollapsed: collapsedNodes.has(nodeId)` and a reactive `onToggleCollapse: () => toggleCollapsed(nodeId)` callback in the node's `data` payload.

### Decision 3: Collapsible Header Button and Table Layout in MemoryNode.tsx
In `MemoryNode.tsx`:
- Render a toggle button arrow (`▼` when expanded, `▶` when collapsed) in the header of STL container nodes.
- Clicking the toggle arrow calls `data.onToggleCollapse()`.
- Condition rendering of the element body based on `!data.isCollapsed`.
- Render elements in a structured table layout with `Key` and `Value` column headers.

## Risks / Trade-offs

- **[Risk]** React Flow might perform extra renders when the `collapsedNodes` state updates.
  → **Mitigation**: This is standard React state behavior. The canvas state remains highly performant since the number of visible nodes is small (capped by GDB traversal depth).
- **[Risk]** Cleared C++ template type names might look identical for different maps (e.g. two maps of `std::string, int`).
  → **Mitigation**: Stack variable nodes clearly display the variable name, and heap nodes display their unique hex memory address in the footer to prevent confusion.
