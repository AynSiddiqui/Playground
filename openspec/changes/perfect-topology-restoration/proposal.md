## Why

We currently have a critical order-of-execution bug during dynamic node creation. Because the logic processes nodes one by one, if node A points to node B, but node B hasn't been iterated yet, `addressToNodeId.get('B')` returns undefined. The arrow logic silently aborts, and the edge is permanently lost! This is why all forward arrows in Linked Lists drop, and since Binary Tree children are always processed after their parents, *every single arrow* in a Binary Tree vanishes.

## What Changes

To fix this flawlessly while retaining strict ghost-node prevention:
1. **Pre-Registration Pass**: Before we draw *any* edges, we will loop through `links.nodes` and dynamically register/create all missing nodes upfront.
2. **Edge Generation Pass**: Only after all dynamically created nodes are safely in the `addressToNodeId` registry will we run the `addStructEdge` logic.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: Guarantees perfect edge generation by utilizing a two-pass node creation and edge generation strategy, ensuring forward-pointing pointers never abort.

## Impact
- **Frontend**: All missing arrows in Linked Lists and Binary Trees will immediately reappear. Ghost nodes will stay dead.
