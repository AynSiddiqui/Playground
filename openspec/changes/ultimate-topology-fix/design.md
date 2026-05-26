## Context
Single-pass generation creates race conditions for dynamically generated nodes. Additionally, early aborts in edge generation inadvertently strip data from the node's UI.

## Goals
- Guarantee forward pointer resolution via a Two-Pass architecture.
- Ensure all pointer fields are visible in the Node UI, even if they are dangling.

## Decisions
1. **Pass 1 (Node Creation)**: Iterate over `Object.entries(links.nodes)`. If the node doesn't exist in `addressToNodeId`, create it and map it. Do NOT process edges or mark `processedStructuralLinks` yet.
2. **Pass 2 (Edge Generation)**: Iterate over `Object.entries(links.nodes)` again. Look up the ID. If it's already in `processedStructuralLinks`, skip. Otherwise, mark it, push `subVariables`, create all edges, and sync state. 
3. **Data Pre-Push**: Inside `addStructEdge`, `subVariables.push` will execute *before* `if (!targetNodeId) return;`. This ensures the node box always displays its fields.
