## Why

The strict memory validation patch removed critical dynamic node creation logic. Because the Go backend (`gdb.go`) sometimes fails to extract the entirety of deep structures like Binary Trees into the `snapshot.heap` array, the frontend *must* dynamically generate these nodes on the canvas if they are discovered in the Python backend's `structuralLinks` registry. By blocking this, Binary Trees broke entirely.

Furthermore, a manual edit accidentally deleted the critical `ed.variables = [...subVariables]` assignment block. Without this assignment, the `memoryNode` never receives its inner data (`val`) or its Handles (`next`, `left`, `right`). Without Handles, React Flow cannot draw any arrows, causing Linked List pointers to disappear.

## What Changes

1. **Restore Dynamic Node Creation**: We will reintroduce the logic that dynamically creates heap nodes if they are missing from `addressToNodeId`, guaranteeing that complete Binary Trees and Linked Lists appear on the canvas even if the Go backend missed them.
2. **Restore Internal Variables**: We will restore the assignment of `subVariables` to the existing node's data. This populates the inner value boxes (like `val: 10`) and generates the Handles that SVG arrows need to lock onto.
3. **Ghost Node Prevention (Delete Bug)**: To ensure deleted nodes don't resurrect while still allowing dynamic creation, we will ignore dynamic creation *only* if the address explicitly corresponds to a deleted pointer footprint, or simply rely on the fact that deleted pointers point to `0x0` which we already filter.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: The graph builder must dynamically expand incomplete heap snapshots using the Python structural registry, and must correctly bind internal variable data to the nodes so arrows can connect.

## Impact
- **Frontend**: Binary Trees will fully render again. Linked List boxes will display their values. Pointers will route perfectly to their targets without looping.
