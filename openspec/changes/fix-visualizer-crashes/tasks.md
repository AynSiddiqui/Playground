## 1. Backend Fixes
- [x] 1.1 In `backend/internal/debugger/gdb.go` inside `extractHeapObjects`, add logic to split the `local.Address` by `" "` (space) and take the first element to sanitize debug symbols.

## 2. Frontend Fixes
- [x] 2.1 In `frontend/src/components/MemoryCanvas.tsx`, update `buildNodesAndEdges` to default `snapshot.heap` and `snapshot.stack` to `[]` using the `||` operator.
- [x] 2.2 Verify `MemoryCanvas.tsx` is rendering stack variables strictly as flat rows inside the Stack Node, and generating an explicit React Flow `<Edge>` to the target address, fulfilling the isolation requirement.
