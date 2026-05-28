## Why

The starting points (handles) for pointer edges are currently misaligned with their respective rows on tree nodes and linked list structures. This misalignment happens because the code uses a hardcoded height calculation (`50 + i * 32` pixels) to position the handles. When the actual row height deviates from 32 pixels due to dynamic styling (font size, margins, padding), the handle position drifts, causing visual misalignment that gets worse with more rows.

## What Changes

- Nest connection handles inside their respective row containers.
- Establish relative positioning on rows and position handles absolutely within them to center them vertically on the right edge.
- Eliminate the hardcoded pixel-offset calculations in `MemoryNode.tsx`.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `memory-visualization-ui`: Add requirement for precise, dynamic vertical centering of row-level connection handles.

## Impact

- `frontend/src/components/MemoryNode.tsx`: Refactor source handle placement and container styling.
- `frontend/src/index.css`: Style row containers as relatively positioned anchors for handles.
