## 1. Make StructuralLinks the Canonical Source

- [x] 1.1 In `MemoryCanvas.tsx`, remove the heap structural processing loops (Pass 1 and Pass 2 inside the `snapshot.heap` loop's `rawLinks` condition), since the stack loop's structural processing is now the sole creator of structural nodes and edges.
- [x] 1.2 In the `snapshot.heap` loop's node push (line ~202-217), add a guard: `if (addressToNodeId.has(obj.address)) return;` — skip pushing heap nodes that were already created by structural link processing, preventing variable overwrite.
- [x] 1.3 In stack Pass 1 (dynamic node creation), pass `rawStackLinks` into the node's `advancedData` field so dynamically created nodes carry structural metadata.

## 2. Deduplicate Edge Generation

- [x] 2.1 In the heap field edge loop (`(obj.fields || []).forEach`), add a filter: skip fields whose name is `next`, `prev`, `left`, or `right` to prevent duplicate edges with structural link connections.
- [x] 2.2 Verify that `addStructEdge` in stack Pass 2 correctly creates edges for all structural pointer fields, and that these edges have the correct source Handle (matching the variable name added to `subVariables`).

## 3. Guarantee Handle Generation

- [x] 3.1 In stack Pass 2, verify that `subVariables` always includes ALL pointer link fields (`next`, `prev`, `left`, `right`) as Variables with `type: 'Node*'`, regardless of whether the edge resolves — ensuring Handle elements are always rendered by MemoryNode.
- [x] 3.2 After all changes, run `npx tsc --noEmit` and verify zero type errors.
