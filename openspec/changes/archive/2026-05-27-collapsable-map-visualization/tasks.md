## 1. Type Signature Parser

- [x] 1.1 In `frontend/src/components/MemoryCanvas.tsx`, implement `getCleanSTLTypeName` to parse complex C++ nested template signatures into clear, short labels.
- [x] 1.2 Update the label formatting in `buildNodesAndEdges` for heap/stl nodes to display the cleaned type name. Save the full type in a `rawType` field inside node data.

## 2. Persistent State Logic

- [x] 2.1 In `MemoryCanvas.tsx` component, add `collapsedNodes` state and pass `isCollapsed` and `onToggleCollapse` callback inside the node's `data` payload.

## 3. Frontend MemoryNode Layout

- [x] 3.1 Update `MemoryNode.tsx` to render a toggle arrow in the node header when it represents an STL container, and hide/show the elements table accordingly.
- [x] 3.2 Add styling definitions for `.memory-node__collapse-toggle` and table borders in `frontend/src/index.css`.
