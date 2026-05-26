## 1. Restore Dynamic Node Creation
- [x] 1.1 In `MemoryCanvas.tsx`, inside BOTH the `snapshot.stack` and `snapshot.heap` structural loops (`Object.entries(links.nodes).forEach`), remove the strict `if (!resolvedId) return;` block.
- [x] 1.2 Replace it with dynamic fallback logic: `let resolvedId = addressToNodeId.get(addr); if (!resolvedId) { resolvedId = 'heap-' + addr; addressToNodeId.set(addr, resolvedId); nodes.push({ id: resolvedId, type: 'memoryNode', position: {x:0, y:0}, data: { label: links.type + ' Node', category: 'heap', address: addr, variables: [] } }); }`
- [x] 1.3 Keep the `processedStructuralLinks` check: `if (processedStructuralLinks.has(resolvedId)) return; processedStructuralLinks.add(resolvedId);`.

## 2. Restore Internal Variable Binding
- [x] 2.1 At the very end of the `Object.entries(links.nodes).forEach` block (after all `addStructEdge` calls), append the critical state injection: `const existing = nodes.find(n => n.id === resolvedId); if (existing) { (existing.data as any).variables = [...subVariables]; }`.
- [x] 2.2 Repeat this for both the stack loop and the heap loop.
