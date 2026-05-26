## 1. Variable Badge Mapping
- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx::buildNodesAndEdges`, create a `pointerLabels` Map to collect all local variables from the stack that point to valid heap addresses.
- [x] 1.2 Prevent these local pointer variables from generating independent `stack-var-...` React Flow nodes.
- [x] 1.3 Inject the collected `pointerLabels` array into the `data` object of the corresponding heap nodes.

## 2. Inner Fields & Badge Rendering
- [x] 2.1 In `frontend/src/components/MemoryNode.tsx`, remove the `!advancedData` condition from the `variables.map` block so that internal variables (e.g. `data`, `next`) always render, fixing the hollow box and missing handle bugs.
- [x] 2.2 In `MemoryNode.tsx`, render the newly injected `data.labels` array as highlighted tags/badges in the node header (e.g., `[ a ]`, `[ cur ]`).

## 3. Arrow Restitution
- [x] 3.1 Verify that once the `next` variable successfully renders inside the `LISTNODE` box, its React Flow `<Handle>` automatically routes the Dagre `<Edge>` cleanly to the next node in the chain without overlap.
