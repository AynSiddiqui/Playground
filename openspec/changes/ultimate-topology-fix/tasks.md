## 1. Implement Two-Pass Architecture in Stack Loop
- [x] 1.1 In `MemoryCanvas.tsx`, inside the `snapshot.stack` loop's `rawStackLinks` condition, add Pass 1: `Object.entries(links.nodes).forEach(([addr]) => { if (!addressToNodeId.has(addr)) { const newId = 'heap-' + addr; addressToNodeId.set(addr, newId); nodes.push({ id: newId, type: 'memoryNode', position: { x: 0, y: 0 }, data: { label: links.type + ' Node', category: 'heap', address: addr, variables: [] } }); } });`
- [x] 1.2 Leave the existing `Object.entries(links.nodes).forEach(([addr, nodeInfo]) => ...)` loop exactly below it as Pass 2. Remove its redundant node creation block since Pass 1 now handles it.

## 2. Implement Two-Pass Architecture in Heap Loop
- [x] 2.1 Repeat the exact same Pass 1 logic inside the `snapshot.heap` loop's `rawLinks` condition.
- [x] 2.2 Clean up the existing Pass 2 loop to remove redundant node creation, leaving only the `subVariables` and `addStructEdge` generation logic.

## 3. Shift Data Preservation Logic
- [x] 3.1 Inside both `addStructEdge` functions (in the stack loop and heap loop), locate the `subVariables.push` command.
- [x] 3.2 Move the `subVariables.push` command ABOVE the `const targetNodeId = addressToNodeId.get(targetAddr); if (!targetNodeId) return;` check, ensuring it always executes as long as `targetAddr` exists.
