## Why

Currently, when multiple stack variables (like `ListNode* slow` and `ListNode* fast`) point to the exact same heap memory location, the visualizer merges them into static text badges (`[ slow ] [ fast ]`) on the target node's header. While this cleans up graph collisions, it fundamentally ruins algorithmic visualization. For problems like "Hare & Tortoise", tracking the physical movement of individual pointer nodes as they traverse the structural links is critical for understanding the algorithm. Static badges are too subtle and fail to convey the physical reality of the pointers.

## What Changes

1. **Abolish Badges for Animated Pointers**:
- We will completely remove the `pointerLabels` mapping logic from `MemoryCanvas.tsx`.
- Instead, every local stack variable (e.g. `slow`, `fast`) will **always** be generated as a standalone, draggable `category: 'variable'` node on the canvas.

2. **Animated Algorithmic Tracking**:
- If a stack variable points to a valid heap node, the graph builder will draw a dedicated, explicit `<Edge>` connecting the standalone stack node directly to the target heap node.
- To prevent visual clutter when multiple stack pointers target the same node, we will style these edges distinctly (e.g., vibrant pink stroke) and set `animated: true`. The pulsing animation makes it instantly obvious which stack variables are currently "holding" which nodes, enabling effortless visual tracking of algorithmic pointer manipulation.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: Transitions stack-to-heap relationships from a badging system to a dedicated, animated node-edge graph topology to support dynamic algorithmic tracking.

## Impact
- **Frontend**: "Hare & Tortoise" algorithms will beautifully render `slow` and `fast` as independent floating nodes that shoot animated laser-like pointers into the Linked List, updating fluidly as the user steps through the code.
