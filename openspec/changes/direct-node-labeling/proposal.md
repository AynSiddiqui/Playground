## Why

The current implementation of the unified canvas still utilizes "pointer edges" from stack variables to heap objects. As seen in the recent screenshots, when `ListNode* a` and `ListNode* b` point to heap objects, the visualizer still draws tiny standalone boxes for `A` and `B` which point to the heap objects. 

This violates the user's mental model. When a user creates a Linked List, they simply want to see the nodes connected to each other, and they want the nodes to inherently carry the names of the variables pointing to them. Furthermore, because of a parsing issue, the actual `data: 1` and `next: 0x...` variables are still failing to populate inside the `LISTNODE` boxes because `MemoryNode.tsx` bypasses them if they are advanced structures.

## What Changes

1. **Direct Heap Node Labeling**:
- Completely eliminate "pointer variable nodes" (like the standalone `A` or `CUR` boxes).
- Instead, map local pointer variables directly onto the header or body of the heap node they point to. For example, the box for `0x3f0042b0` will have a header label displaying `[a, cur]` to indicate that both the `a` and `cur` variables point to this node.

2. **Advanced Data Field Hydration**:
- Remove the strict condition `!advancedData` in `MemoryNode.tsx` that blocks `variables` from rendering. By simply allowing `variables` to render even on advanced structural nodes, the parsed `data: 1` will explicitly populate the previously hollow `LISTNODE` box.

3. **Restoring Inter-Node Pointer Edges**:
- Once `next` is correctly rendered as a variable inside the `LISTNODE` box, the React Flow `<Handle>` will finally instantiate, allowing the `<Edge>` connecting `a->next` to `b` to successfully draw and perfectly align.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: Refactor node and edge mapping to attach pointer names to heap node labels rather than creating distinct graph nodes. Fix the DOM rendering bypass in `MemoryNode.tsx`.

## Impact
- **Frontend**: The visualizer graph will be dramatically simplified. Only actual heap allocations will be distinct nodes, and variables will serve as tags/badges on those nodes. All structural nodes will visibly display their internal data.
