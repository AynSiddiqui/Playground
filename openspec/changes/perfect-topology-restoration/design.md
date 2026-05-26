## Context
The structural loop generates nodes and edges in a single pass. Forward pointers fail because their targets haven't been dynamically pushed to the registry yet.

## Goals
- Split structural data processing into a Two-Pass Architecture.

## Decisions
1. **Pass 1 (Node Creation)**: Iterate over `Object.entries(links.nodes)`. If the node doesn't exist in `addressToNodeId`, create it and map it. Do NOT process edges or mark `processedStructuralLinks` yet.
2. **Pass 2 (Edge Generation)**: Iterate over `Object.entries(links.nodes)` again. Look up the ID. If it's already in `processedStructuralLinks`, skip. Otherwise, mark it, push `subVariables`, create all edges, and sync state. Because Pass 1 registered everything, `targetNodeId` will always resolve successfully.
