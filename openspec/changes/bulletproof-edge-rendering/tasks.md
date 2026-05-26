## 1. Edge Deduplication
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx::buildNodesAndEdges`, declare `const edgeMap = new Map<string, Edge>();` instead of the `edges` array.
- [x] 1.2 Find all instances of `edges.push(...)` and replace them with `edgeMap.set(edgeObj.id, edgeObj);`.
- [x] 1.3 Update the return statement of `buildNodesAndEdges` to return `Array.from(edgeMap.values())` for the edges.

## 2. React Mutation Triggers
- [x] 2.1 In `MemoryCanvas.tsx`, locate the block where `ed.variables = subVariables;` is applied to existing nodes.
- [x] 2.2 Change it to `ed.variables = [...subVariables];` to ensure React's shallow comparison detects the state change and re-renders the values and handles onto the node UI.
