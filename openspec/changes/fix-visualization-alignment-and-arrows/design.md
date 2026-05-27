## Context

The memory visualizer currently right-aligns map value cells, leading to a mismatched look when compared to left-aligned headers. Furthermore, C++ reference variables (types ending in `&` like `std::pair<...>&` or `int&`) do not draw arrows/edges to the objects they reference because the frontend does not recognize reference variables as pointer-like types.

## Goals / Non-Goals

**Goals:**
- Left-align map and pair values inside visualization tables.
- Draw edges from reference variables (aliasing stack/heap addresses) to the target nodes sharing those addresses.
- Register `std::pair` as an STL type in the frontend visualizer.

**Non-Goals:**
- Do not modify backend data structures or GDB printing logic.
- Do not create custom edge layouts.

## Decisions

### Decision 1: Align Map Values Left in CSS
We will change `text-align: right` to `text-align: left` in `.stl-map-cell-value` rules inside `frontend/src/index.css` to match header alignment.

### Decision 2: Add Reference Recognition in Edge Layout
In `frontend/src/components/MemoryCanvas.tsx`, we will check if a local variable type contains `&`. If so, we treat it as pointing to its memory address `local.address`.
```typescript
const isReference = local.type && local.type.includes('&');
const targetAddr = isPointer ? (local.address || local.value) : (isReference ? local.address : (isSTLOrArray ? local.address : null));
```

### Decision 3: Register std::pair on Frontend
We will add `clean.startsWith('std::pair')` to `isSTLType()` in `MemoryCanvas.tsx`.

## Risks / Trade-offs

- **[Risk]** Reference arrows could overlap if multiple stack reference variables alias the same heap element.
  - *Mitigation*: React Flow automatically uses `smoothstep` edges that route around nodes.
