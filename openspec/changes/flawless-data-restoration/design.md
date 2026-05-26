## Context
The UI relies heavily on the `variables` array mapped to each node. If `variables` is empty, no physical `<Handle>` nodes are rendered, causing Dagre layout edges to drop invisibly.

## Goals
- Restore the `ed.variables = [...subVariables]` state injection.
- Re-enable dynamic node pushing for `links.nodes` that aren't in the base `snapshot.heap`.
- Maintain the strict separation of stack pointer registration to prevent the Ouroboros (looping arrow) bug.

## Decisions
1. **Dynamic Node Resurrection**: We will bring back the `if (!addressToNodeId.has(addr)) { nodes.push(...) }` fallback mechanism inside both the stack and heap structural loops.
2. **Handle Injection**: At the end of every `links.nodes` iteration, we will guarantee that the `subVariables` array (which now contains all the `addStructEdge` fields) is saved back to the node state.
