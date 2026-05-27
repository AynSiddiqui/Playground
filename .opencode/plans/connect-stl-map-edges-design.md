## Overview

This change converts `std::map` and `std::pair` elements from static HTML table rows into standalone React Flow sub-nodes connected by edges. The goal is to make map/pair containers first-class graph citizens where every element is visually connected to its container and memory address.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    DATA FLOW                               │
│                                                            │
│  Python stl_printers.py       Go backend        Frontend   │
│  ┌──────────────────┐    ┌──────────────┐   ┌───────────┐ │
│  │ flatten_stl_     │───▶│  buildSnap-  │──▶│ buildNodes│ │
│  │ container()      │    │  shot()      │   │ &Edges()  │ │
│  │  ✓ emits address │    │  ✓ passes    │   │           │ │
│  │  per element     │    │  address thru│   │ NEW: create│ │
│  └──────────────────┘    └──────────────┘   │ sub-nodes │ │
│                                              │ + edges   │ │
│                                              └───────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Element Sub-Node Data Model

```typescript
// Updated STLElement (types.ts)
interface STLElement {
  index?: number;
  key?: string;
  value: string;
  address?: string;    // NEW: hex address, already in backend JSON
}

// New sub-node data shape (passed via React Flow node.data)
interface STLElementNodeData {
  category: 'stl-element';
  parentAddress: string;
  elementKey: string;
  elementValue: string;
  elementAddress?: string;
  label: string;        // Shows the element key or index
}
```

## Sub-Node Creation (MemoryCanvas.tsx)

**Location:** In `buildNodesAndEdges()`, after the existing heap node creation loop (~line 442).

**Algorithm:**

```
for each heap object obj:
  if obj.isStl AND obj.elements exist AND obj.elements.length <= 50:
    for each element el in obj.elements:
      // Skip elements without valid addresses
      if !el.address OR el.address === '0x0': continue

      // Determine element label
      label = el.key ?? `[${el.index}]`

      // Create sub-node
      subNodeId = `stl-element-${obj.address}-${label}`
      create React Flow node:
        id: subNodeId
        type: 'memoryNode'
        position: calculated by gridLayout()
        data:
          category: 'stl-element'
          label: label
          elementKey: el.key
          elementValue: el.value
          elementAddress: el.address
          parentAddress: obj.address

      // Register address for potential outward edges
      if el.address not in addressToNodeId:
        addressToNodeId.set(el.address, subNodeId)

      // Create container → element edge
      create edge:
        source: heap-${obj.address}
        sourceHandle: bottom (new port)
        target: subNodeId
        targetHandle: top
        type: smoothstep
        animated: true
        style: stroke #a855f7
        markerEnd: ArrowClosed #a855f7

      // Create element → memory edge (if address resolves)
      targetAddr = el.address
      targetNodeId = addressToNodeId.get(targetAddr)
      if targetNodeId AND targetNodeId !== subNodeId:
        create edge:
          source: subNodeId
          target: targetNodeId
          type: smoothstep
          animated: true
          style: stroke #22d3ee
          markerEnd: ArrowClosed #22d3ee
```

## Grid Layout Algorithm

Sub-nodes are positioned deterministically below the parent container node.

```
CONST MAX_PER_ROW = 5
CONST NODE_WIDTH = 180
CONST NODE_HEIGHT = 60
CONST GAP_X = 20
CONST GAP_Y = 30

function gridLayout(parentPosition, parentDimensions, elementIndex):
  row = Math.floor(elementIndex / MAX_PER_ROW)
  col = elementIndex % MAX_PER_ROW
  x = parentPosition.x + (col * (NODE_WIDTH + GAP_X))
       - ((Math.min(elementCount, MAX_PER_ROW) - 1) * (NODE_WIDTH + GAP_X) / 2)
  y = parentPosition.y + parentDimensions.height + GAP_Y
       + (row * (NODE_HEIGHT + GAP_Y))
  return { x, y }
```

This centers the grid below the parent and wraps every 5 elements.

## Edge Routing (Bundled Smoothstep)

To prevent visual spaghetti when a container has many sub-nodes:

1. Parent container gets a new Handle on its bottom edge: `Position.Bottom`
2. All container→element edges route from this single bottom port
3. A shared waypoint is placed midway between the parent bottom and the sub-node grid top
4. Smoothstep routing uses the waypoint to create a bundled trunk effect

```
           ┌──────────────┐
           │  std::map    │
           │  (size=6)    │
           └──────┬───────┘
                  │  ← single bottom port
          ════════╧════════  ← shared waypoint line
         ┌──┐  ┌──┐  ┌──┐
         │k1│  │k2│  │k3│
         └──┘  └──┘  └──┘
         ┌──┐  ┌──┐  ┌──┐
         │k4│  │k5│  │k6│
         └──┘  └──┘  └──┘
```

## Collapse/Expand Integration

**Existing mechanism:** `collapsedNodes` Set<string> in MemoryCanvas.tsx tracks collapsed STL nodes.

**New behavior:**
- When an STL container is collapsed:
  1. All sub-nodes with `data.parentAddress === containerAddress` are set to `hidden: true`
  2. All edges with source or target matching a hidden sub-node are set to `hidden: true`
  3. The container node body reverts to the existing HTML table (backward compatible)
- When expanded:
  1. Sub-nodes and edges are set to `hidden: false`
  2. Sub-node positions are recalculated from `gridLayout()`

## Node Rendering (MemoryNode.tsx)

**New category `stl-element`:**

```
┌─────────────────────┐
│  apple              │  ← label = element key
├─────────────────────┤
│  value: 10          │  ← single row
│  addr: 0x5555...    │  ← small muted text
└─────────────────────┘
```

- Compact design (~180×60px)
- Background: dark purple/indigo (`#1e1b4b` with `#a855f7` border)
- Top section: element key as label (bold, purple)
- Bottom section: value string + muted address

## Stack→Heap Edge Investigation

**Problem:** `dereferencePointer` at `gdb.go:373` uses format string `"*(%s*)%s"`. For non-pointer STL types, `ptrType` becomes `"std::map<...>*"` (added `*`), making the full expression `"*(std::map<...>**)0x..."` — a double indirection.

**Investigation steps:**
1. Add a debug log in `extractHeapObjects` to check if `dereferencePointer` returns nil for STL stack variables
2. If nil: the double-indirection is the bug. Fix format string to `"*(%s)%s"` (remove extra `*`)
3. If non-nil: edge exists but stack→heap addresses are identical. The edge renders as a tiny self-loop — need to adjust the source port offset to make the edge visible

## Edge Cases

| Case | Behavior |
|------|----------|
| Map with 0 elements | No sub-nodes, container shows "(empty)" |
| Map with 1 element | 1 sub-node |
| Map with 50 elements | 50 sub-nodes (10 rows × 5 cols) |
| Map with 51+ elements | Fallback to table, shows "(50+ entries)" |
| Element with `address: "0x0"` | No element→memory edge |
| Nested `map<string, map<string,int>>` | Outer map expanded (sub-nodes), inner map is one sub-node with its own table |
| `std::pair` | Two sub-nodes: `first` and `second` |
| `std::vector` / `std::set` | Unchanged — table rendering |
| `std::unordered_map` | Unchanged — table rendering |

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sub-node type | External React Flow nodes | Enables edges to other memory nodes, standard interaction |
| Element limit | 50 (constant `ELEMENT_NODE_LIMIT`) | Balances detail vs. performance/clutter |
| Layout strategy | Grid below parent, deterministic | Simple, predictable, no layout engine needed |
| Edge routing | Bundled smoothstep from parent bottom | Prevents spaghetti with many elements |
| Collapse behavior | Hide sub-nodes, show summary table | Backward compatible, clear state |
| Unordered_map | Not in scope | Hash table topology is different — defer |
| Node color | Indigo/dark-purple | Distinct from variable (pink) and heap (cyan) |
