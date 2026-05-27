## Context

Stack-allocated STL containers (`std::map`, `std::pair`, etc.) fail to produce a visible stack→heap edge due to two issues:

### Backend Issue (ADDRESSED)
The Go backend's `extractHeapObjects()` calls `dereferencePointer()`, which sends a GDB MI2 expression like:
```
-data-evaluate-expression "*(std::map<std::__cxx11::basic_string<char, ...>>*)0x7fff..."
```

GDB's C++ expression parser cannot handle the commas nested inside `<>` in the template type string. `sendCommand` returns an error, `dereferencePointer` returns nil, no `HeapObject` is created.

**Solution**: A fallback in `extractHeapObjects()` creates the `HeapObject` directly using the `adv-dump` Python command via GDB's Python API, which handles complex type strings correctly.

### Frontend Issue (TO BE ADDRESSED)
Even when a `HeapObject` is created, the React Flow edge is never rendered because:

1. `MemoryCanvas.tsx:262-277` creates an edge from the stack variable to the heap node
2. The edge has `sourceHandle: "${nodeId}-${local.name}"`
3. `MemoryNode.tsx:82-88` only renders `Handle` components when `v.type.includes('*')`
4. For STL types (`std::map<...>`, etc.), there's no `*` in the type name
5. React Flow cannot render an edge without a matching `Handle` in the DOM
6. Result: edge is silently dropped

**Solution**: In `MemoryNode.tsx`, add an additional condition for Handle rendering that includes STL types, alongside the existing pointer type check.

## Goals / Non-Goals

**Goals:**
- Stack-allocated `std::map` and `std::pair` produce HeapObjects in the backend ✅ (done)
- Stack→heap edge is visually rendered in the React Flow canvas
- Stack variable node has a source Handle for non-pointer STL types
- Distinct edge color (amber) for STL relationships

**Non-Goals:**
- Red-black tree topology visualization (future scope)
- Frontend sub-node expansion (not needed — maps render as table nodes)
- `std::vector` and `std::set` changes (already work)

## Frontend Design

### Handle Rendering for STL Variables
**File**: `frontend/src/components/MemoryNode.tsx`

Currently (lines 82-88), source handles are rendered only for pointer types:
```typescript
{v.type.includes('*') && (
  <Handle
    type="source"
    position={Position.Right}
    id={`${id}-${v.name}`}
    style={{ background: '#22d3ee', top: 14 }}
  />
)}
```

**Change**: Add a helper function to detect STL types, then render a Handle for both pointer types AND STL types:
```typescript
const isSTLType = (type: string) => {
  // Check against known std:: prefixes (vector, map, set, etc.)
};

// In the render for category === 'variable':
{(v.type.includes('*') || isSTLType(v.type)) && (
  <Handle
    type="source"
    position={Position.Right}
    id={`${id}-${v.name}`}
    style={{ background: isSTLType(v.type) ? '#f59e0b' : '#22d3ee', top: 14 }}
  />
)}
```

Use amber color (#f59e0b) for STL handles to differentiate them visually from pointer handles (cyan #22d3ee).

### Edge Styling for STL Connections
**File**: `frontend/src/components/MemoryCanvas.tsx`

In `buildNodesAndEdges()`, detect when an edge connects a stack variable to a heap node at the same address. Style it distinctly:

```typescript
// Around line 265, where the edge is created for STL types:
if (isSTLOrArray && targetAddr) {
  const edgeObj = {
    id: `edge-stack-var-${frame.frameId}-${local.name}`,
    source: nodeId,
    sourceHandle: `${nodeId}-${local.name}`,
    target: targetNodeId,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },  // amber for STL
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
  };
  edgeMap.set(edgeObj.id, edgeObj as Edge);
}
```

## Decisions

1. **Reuse existing Handle infrastructure** — No new React Flow components needed. Just extend the Handle rendering condition.

2. **Amber color for STL edges** — Distinct from pointer edges (cyan) and field edges (cyan), making the relationship clear at a glance.

3. **No new fields or types** — Use existing `isSTLType()` function from the codebase (already in `MemoryCanvas.tsx:94-109`).

## Risks / Trade-offs

- [Risk] The `isSTLType()` function in MemoryNode may not match all STL variants → Mitigation: Import or duplicate the same `isSTLType()` function from `MemoryCanvas.tsx` to ensure consistency.
- [Risk] Edge color changes may affect user mental models → Mitigation: Amber is a middle ground between pointer (cyan) and error (red), clearly indicating "logical ownership" of heap data.
