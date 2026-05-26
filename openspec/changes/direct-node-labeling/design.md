## Context
When parsing `obj.advancedData` (from `__debug_adv`), `MemoryNode.tsx` mistakenly hid standard `variables` mapping because it expected `advancedData` to completely take over rendering. However, the Python `stl_printers` extracts `__debug_adv` as purely structural logic, leaving the `data` fields to be hydrated via `subVariables`. Because `MemoryNode` hid them, handles failed to spawn and the nodes looked empty. 

Additionally, stack pointers are currently generating independent React Flow nodes. We want to convert stack pointers into labels on the heap nodes they reference.

## Goals / Non-Goals
**Goals:**
- Patch `MemoryNode.tsx` to stop suppressing the `variables` array.
- In `MemoryCanvas.tsx`, extract local pointer variables and map their names (e.g. `"a"`, `"cur"`) as an array of `pointerLabels` injected into the `heap-${targetAddr}` node.
- Render these `pointerLabels` as distinct badges on the heap node.

**Non-Goals:**
- We are not discarding Dagre or React Flow. We are strictly simplifying the node taxonomy to `Heap Objects Only`.

## Decisions
- **Label Mapping Loop**: Before generating React Flow nodes, loop over `snapshot.stack[].locals`. For any variable pointing to a valid heap address, append its name to a `pointerLabels[targetAddress]` map.
- **Node Injection**: When building the heap node `data`, inject `labels: pointerLabels[obj.address] || []`.
- **Badge Rendering**: In `MemoryNode.tsx`, iterate over `data.labels` and render them as floating badges above or alongside the `category` icon.
