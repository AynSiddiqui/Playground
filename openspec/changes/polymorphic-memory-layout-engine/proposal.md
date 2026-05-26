## Why

The current architecture uses a generic graph layout that fails to visually differentiate distinct structural patterns. Linked lists remain erroneously anchored to stack frames, binary trees lack hierarchical coordinate computation, and complex STL containers cause layout collapses or display raw compiler metadata instead of clean abstractions. Every data structure needs an isolated visualization paradigm to make memory debugging intuitive.

## What Changes

- **Polymorphic Structural Schema (Backend & Protocol)**: Refactor the WebSocket JSON snapshot schema to explicitly categorize every variable and heap object into a defined structural type: `PRIMITIVE`, `ARRAY_1D`, `MATRIX_2D`, `LINKED_LIST`, `BINARY_TREE`, or `STL_CONTAINER`. The GDB Python pretty printers must resolve structural links (next/prev/left/right) and flatten STL internals before serialization.
- **Isolated Canvas Visualizers (Frontend Layout Engine)**: Replace the shared single graph layout for complex types with dedicated React Flow rendering subsystems — Grid Layout (arrays/matrices), Linear Chain (linked lists), Hierarchical Tree (binary trees), and a static Stack Frame Panel (primitives/pointers). Each renderer uses its own layout algorithm and edge routing.
- **Node Isolation & State Transitions**: Every variable instance or dynamic allocation renders inside its own fully bounded, isolated box. Pointer changes trigger smooth SVG edge animation via CSS transitions instead of node glitching.
- **Payload Debug Visibility**: The backend outputs formatted JSON snapshots with structural type tags to the terminal console during execution for instant verification.

## Capabilities

### New Capabilities
*(none — all changes modify existing capabilities)*

### Modified Capabilities
- `debugger-integration`: Update GDB Python parsing scripts to inject explicit structural type descriptors (`PRIMITIVE`, `MATRIX_2D`, `BINARY_TREE`, etc.) into the state extraction payload, including recursive resolution of `next`/`prev`/`left`/`right` structural links and flattening of STL internals.
- `websocket-protocol`: Extend the `snapshot` event schema with a required `type` field on every variable and heap object entry, carrying the structural classification tag. The container format must support both registry-based (flat node list with address keys for trees/lists) and indexed (arrays/matrices) representations.
- `memory-visualization-ui`: Re-architect the canvas into specialized polymorphic rendering components — Grid Renderer, Linear Chain Renderer, Hierarchical Tree Renderer, and Stack Frame Panel — each enforcing its own layout algorithm, edge style, and node isolation rules. Add CSS-based edge animation for smooth pointer transitions.

## Impact

- **Backend**: GDB Python pretty printers (`debugger-integration`) — structural link resolution, STL flattening, type tagging, console JSON dump
- **Protocol**: WebSocket snapshot schema (`websocket-protocol`) — new required `type` field, registry-based container format for trees/lists
- **Frontend**: React Flow canvas (`memory-visualization-ui`) — 4 new renderer components, Dagre tree layout, CSS edge transitions
- **No new external dependencies** — Dagre is already available in the React Flow ecosystem
