## Why

The recent "polymorphic memory layout engine" completely stripped away the unified graphical representation by physically separating the UI into disconnected `StackPanel` and `HeapRendererSlot` HTML blocks. This removed the ability to render physical arrow connections (edges) between pointer variables and the memory they reference, which is the entire point of a memory visualizer. Data structures like Linked Lists and Trees lose all visual context when their interconnected pointers cannot be explicitly drawn.

We must eliminate the "canvas split" and return to a single, unified view where all objects (stack variables and heap allocations) exist on the exact same graphical plane, allowing explicit SVG arrows to map their connections perfectly.

## What Changes

1. **Remove Canvas Split**: Revert the split `StackPanel` and `HeapPanel` polymorphic architecture. 
2. **Unified React Flow View**: Restore `@xyflow/react` as the absolute source of truth for the entire visualizer.
3. **Single Graph Ecosystem**: 
   - The Stack Frame (containing local primitive variables) will render as a standard `MemoryNode` on the React Flow canvas.
   - All Heap Objects (STLs, Linked Lists, Trees) will render as independent `MemoryNode` components on the same React Flow canvas.
4. **Explicit Edge Routing**: Iterate through all variables and strictly draw React Flow `<Edge>` components representing pointers (e.g. `next`, `left`, `right`) connecting the discrete nodes together.

## Capabilities

### Modified Capabilities
- `memory-visualization-ui`: The UI MUST render exactly one unified React Flow canvas. Stack frames and Heap objects MUST exist on the same coordinate plane, avoiding any HTML split panels.
- `debugger-integration`: Edge detection must flawlessly identify and serialize connection endpoints between node IDs so React Flow can map the DAG edges.

## Impact

- **Frontend**: `MemoryCanvas.tsx` will be completely overhauled back to a unified `@xyflow/react` topology. `StackPanel`, `LinearChainRenderer`, and `HierarchicalTreeRenderer` will be deleted as their functionality is natively handled by React Flow's DAG layout and node architecture.
