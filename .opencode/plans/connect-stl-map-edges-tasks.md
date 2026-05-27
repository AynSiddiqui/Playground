## Prerequisites

- [ ] Read `frontend/src/types.ts` to understand the current `STLElement` interface
- [ ] Read `frontend/src/components/MemoryCanvas.tsx` to understand `buildNodesAndEdges()`
- [ ] Read `frontend/src/components/MemoryNode.tsx` to understand the rendering logic
- [ ] Read `frontend/src/index.css` for existing STL map styles
- [ ] Read `backend/internal/debugger/gdb.go` lines 328-420 for `dereferencePointer` investigation

## 1. Add address field to STLElement type

**File:** `frontend/src/types.ts`

- [ ] 1.1 Add optional `address?: string` to the `STLElement` interface
- [ ] 1.2 Verify downstream usage — since `advancedData` is typed as `any` and `elements` are parsed from JSON, no other type changes should be needed

## 2. Investigate stack→heap edge for STL types

**File:** `backend/internal/debugger/gdb.go`

- [ ] 2.1 Trace whether `extractHeapObjects()` successfully creates a HeapObject for stack-allocated STL containers
- [ ] 2.2 Check the format string at line 373: `"*(%s*)%s"` — verify that `ptrType` with appended `*` doesn't cause double-indirection
- [ ] 2.3 If a bug is found: fix the format string to `"*(%s)%s"` (remove the extra `*`) and test
- [ ] 2.4 If no bug: the stack→heap edge may exist but render oddly (same address for both). Add a comment documenting the behavior

## 3. Add sub-node creation in buildNodesAndEdges

**File:** `frontend/src/components/MemoryCanvas.tsx`

- [ ] 3.1 After the heap node creation loop (~line 442), add a new loop over heap objects with `isStl` and `elements`
- [ ] 3.2 For each element with `elements.length <= ELEMENT_NODE_LIMIT`:
  - [ ] 3.2.1 Skip elements without a valid address (`!el.address || el.address === '0x0'`)
  - [ ] 3.2.2 Determine the element label (`el.key ?? \`[\${el.index}]\``)
  - [ ] 3.2.3 Create the React Flow sub-node with `category: 'stl-element'`
  - [ ] 3.2.4 Register `el.address` in `addressToNodeId` (if not already present)
  - [ ] 3.2.5 Push the sub-node into the `nodes` array
- [ ] 3.3 For maps exceeding `ELEMENT_NODE_LIMIT`: skip sub-node creation (fallback to existing table rendering)

## 4. Implement grid layout for sub-nodes

**File:** `frontend/src/components/MemoryCanvas.tsx`

- [ ] 4.1 Implement `gridLayout()` function with `MAX_PER_ROW = 5`
- [ ] 4.2 Calculate sub-node position based on the parent node's position and dimensions
- [ ] 4.3 Center the grid horizontally below the parent
- [ ] 4.4 Apply positions to sub-nodes during creation

## 5. Create edges between container and element sub-nodes

**File:** `frontend/src/components/MemoryCanvas.tsx`

- [ ] 5.1 Create edges from the container node to each sub-node:
  - Edge id: `edge-stl-${obj.address}-${elementLabel}`
  - Source: parent heap node id
  - Target: sub-node id
  - Type: `smoothstep`, animated
  - Style: `stroke: '#a855f7'` (purple)
  - MarkerEnd: `ArrowClosed`, `#a855f7`
- [ ] 5.2 Create edges from each sub-node to its memory address:
  - If `el.address` resolves to a different node in `addressToNodeId`
  - Edge id: `edge-stl-addr-${el.address}`
  - Source: sub-node id
  - Target: resolved node id
  - Type: `smoothstep`, animated
  - Style: `stroke: '#22d3ee'` (cyan)
  - MarkerEnd: `ArrowClosed`, `#22d3ee`

## 6. Add bottom handle to parent container node

**File:** `frontend/src/components/MemoryNode.tsx`

- [ ] 6.1 Add a new `Handle` with `type="source"` and `Position.Bottom` to the MemoryNode component
- [ ] 6.2 Only render this handle when the node is an STL container with expandable sub-nodes
- [ ] 6.3 Ensure it does not interfere with existing left/right handles

## 7. Add stl-element rendering in MemoryNode

**File:** `frontend/src/components/MemoryNode.tsx`

- [ ] 7.1 Add a new rendering branch for `category === 'stl-element'`
- [ ] 7.2 Render a compact layout:
  - Top: bold purple label (element key)
  - Bottom: value string with muted address text
- [ ] 7.3 Use distinct visual styling (dark indigo background, purple border)
- [ ] 7.4 Add a top `Handle` (`type="target"`, `Position.Top`) for incoming container edges
- [ ] 7.5 Add a right `Handle` (`type="source"`, `Position.Right`) for outgoing memory-address edges

## 8. Update collapse/expand to handle sub-nodes

**File:** `frontend/src/components/MemoryCanvas.tsx`

- [ ] 8.1 When a container node is toggled collapsed:
  - Collect all sub-node IDs with matching `parentAddress`
  - Set `hidden: true` on those sub-nodes
  - Set `hidden: true` on all edges connected to those sub-nodes
- [ ] 8.2 When a container node is toggled expanded:
  - Set `hidden: false` on sub-nodes and their edges
  - Recalculate sub-node positions via `gridLayout()`
- [ ] 8.3 Ensure collapse state persists across snapshot transitions (existing `collapsedNodes` set handles this)

## 9. Add CSS styles

**File:** `frontend/src/index.css`

- [ ] 9.1 Add styles for `.stl-element-node`:
  - Background: dark indigo (`#1e1b4b`)
  - Border: purple (`#a855f7`)
  - Compact sizing (max-width 180px, min-height 60px)
- [ ] 9.2 Add styles for `.stl-element-label` (bold, purple)
- [ ] 9.3 Add styles for `.stl-element-value` (white/gray, monospace)
- [ ] 9.4 Add styles for `.stl-element-address` (muted, smaller font, monospace)

## 10. Verification

- [ ] 10.1 Test a `std::map<string, int>` with 3 entries — verify sub-nodes appear with edges
- [ ] 10.2 Test a `std::pair<string, int>` — verify `first` and `second` sub-nodes
- [ ] 10.3 Test collapse/expand — verify sub-nodes hide/show
- [ ] 10.4 Test a map with 51+ entries — verify table fallback
- [ ] 10.5 Test `std::vector` and `std::set` — verify they are NOT affected (no sub-nodes)
- [ ] 10.6 Test step-through — verify sub-nodes update on new snapshots
- [ ] 10.7 Run `npm run build` (or relevant frontend build) — verify no TypeScript errors
- [ ] 10.8 Run `go build` (or relevant backend build) — verify if Go changes were needed
