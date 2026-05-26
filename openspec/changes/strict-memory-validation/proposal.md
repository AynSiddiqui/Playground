## Why

The memory visualizer currently suffers from a "phantom node" problem caused by uninitialized pointers and deleted memory (`delete node;`).
1. **Uninitialized Variables**: If a user declares `ListNode* temp;` without initializing it, it contains a random garbage address. The frontend blindly tries to draw a fake node for this garbage address because it appears in the structural links traversal.
2. **Deleted Memory**: When a user runs `delete temp;`, the C++ runtime frees the memory, and the backend correctly removes it from the heap tracking list. However, if `temp` still holds the dangling pointer, the frontend forces the node to reappear on the canvas like a ghost, simply because the pointer reference exists in the data.

## What Changes

We will introduce a **Strict Memory Registry** in the React frontend to absolutely forbid the rendering of phantom nodes.
- **Universal Address Validation**: Before drawing *any* edge or processing *any* structural link, the graph builder will check if the memory address legally exists in the active execution state (either explicitly allocated on the `heap`, or explicitly declared on the `stack`).
- **Complete Disappearance on Delete**: If an address is NOT in the valid registry (because it was deleted, or because it's a random garbage number), the frontend will completely ignore it. It will not spawn a fake box for it, and it will not draw arrows to it.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: The graph builder must securely map and validate all memory addresses against the explicit state snapshot, preventing dangling pointers or uninitialized variables from spawning fake nodes.

## Impact
- **Frontend**: When a user executes `delete node;`, the visualizer will instantly and cleanly vaporize the node from the canvas, even if a dangling pointer still references its address. Uninitialized variables will remain neatly disconnected until they are assigned a valid allocation.
