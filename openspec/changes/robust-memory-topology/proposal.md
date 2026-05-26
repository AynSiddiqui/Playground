## Why

The memory visualizer currently exhibits three topological bugs introduced by overlapping data flows:
1. **Arrows Pointing to Themselves (The Ouroboros Bug)**: Stack pointers are mistakenly registering their *target* memory addresses as their *own* node IDs in the unified address registry. When the graph builder attempts to draw an arrow to the target, the registry loops it right back to the stack pointer itself!
2. **Duplicate Edge Generation**: Because both the `stack` iterator and the `heap` iterator process the identical structural JSON registries returned by the Python backend, the canvas generates duplicate identical arrows for every structural connection. 
3. **Inconsistent UI across Trees and Lists**: The `MemoryNode.tsx` component is currently applying a set of hardcoded, absolutely-positioned green Handles for Binary Trees, which clashes with the dynamically generated dynamic Handle logic used by Linked Lists. This fractures the visual aesthetic.

## What Changes

1. **Pointer Isolation in the Registry**: We will strictly filter `addressToNodeId` registration. If a stack variable is a pointer (i.e., its type includes `*`), we will explicitly forbid it from overwriting the registry, guaranteeing that pointer arrows resolve to the correct heap destinations instead of looping back to themselves.
2. **Structural Deduplication**: We will introduce a fast `processedStructuralLinks` Set into the graph builder. This ensures that regardless of how many times the backend sends the structural topology (via stack locals or heap blocks), the canvas will compute the edges exactly once, eliminating duplicate SVG rendering.
3. **Unified Component Handles**: We will strip the hardcoded green `<Handle>` components out of `MemoryNode.tsx`. Both Binary Trees and Linked Lists will seamlessly fall back to the unified `variables.map` renderer, guaranteeing perfectly spaced, color-coded rows and arrows for all structural architectures.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: Guarantees flawless, non-looping pointer resolution and unifies the rendering aesthetics of all tree and list nodes.

## Impact
- **Frontend**: Stack pointers will beautifully snap to their targets. Deleted nodes will stay invisible. Binary Trees and Linked Lists will look identical in their node structure and edge rendering.
