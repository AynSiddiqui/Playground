## Why

Structural data structure connections (linked list arrows, binary tree edges) are silently lost in the canvas. The backend populates `AdvancedData` on heap objects with complete structural registries (all nodes, all links), but the frontend never reads it — it only looks for `structuralLinks` on stack locals, which the Go backend never populates. Meanwhile `chaseNodePointers` is broken because `parseFieldsFromEval` is a stub, so child nodes never make it into the heap array either. The result: no arrows for lists, only root nodes for trees.

## What Changes

- Fix `parseFieldsFromEval` in `gdb.go` to properly extract field `name` and `type` from GDB MI output, enabling `chaseNodePointers` to discover child nodes
- Add a heap-object `AdvancedData` fallback path in `MemoryCanvas.tsx` so structural nodes and edges are created even when stack locals lack `structuralLinks`
- Replace the unconditional `structuralFieldNames` edge filter with a conditional guard — skip `next`/`prev`/`left`/`right` edges only when structural processing actually handled them
- Add a new `MemoryCanvas.tsx` utility `buildStructuralFromAdvancedData` to extract structural registries from heap `AdvancedData` and run the same Pass 1 + Pass 2 logic used for stack `structuralLinks`

## Capabilities

### New Capabilities

- `structural-edge-failsafe`: Defense-in-depth for structural edge rendering — handles data from stack `structuralLinks`, heap `AdvancedData`, and heap fields with proper deduplication and no data loss

### Modified Capabilities

- `memory-visualization-ui`: The "Guaranteed Edge Rendering" requirement already says to handle both `structuralLinks` and `advancedData`, but the frontend only implements the first path. This change closes that gap.
- `debugger-integration`: The "Structural Object Evaluation" requirement depends on `chaseNodePointers` working, which is broken due to `parseFieldsFromEval` being a stub. This change fixes that parser.

## Impact

- `backend/internal/debugger/gdb.go`: ~20 lines changed in `parseFieldsFromEval` to properly extract field name/type/value
- `frontend/src/components/MemoryCanvas.tsx`: New `buildStructuralFromAdvancedData` utility + heap `AdvancedData` check + conditional field filter
- No new Go/Python dependencies. No schema changes. No API contract changes.
