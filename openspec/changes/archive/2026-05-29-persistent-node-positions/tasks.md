## 1. Local Coordinate Caching

- [x] 1.1 Add React `useRef` to `MemoryCanvas` to store mapping of Node ID to coordinates
- [x] 1.2 Implement the `onNodeDragStop` event handler to capture final drag positions and update the coordinate cache ref
- [x] 1.3 Add `onNodeDragStop` callback prop to `<ReactFlow>` component

## 2. Layout Merging

- [x] 2.1 Refactor node setup to check `manualPositions.current` for existing coordinate records during snapshot changes
- [x] 2.2 Re-assign node coordinate properties dynamically post-Dagre auto-layout using cached overrides

## 3. UI Controls and Styling

- [x] 3.1 Place a "Reset Layout" button inside the floating canvas panel next to the edge styling selector
- [x] 3.2 Implement clean handler logic to empty the coordinate cache and re-trigger layout updates on click
- [x] 3.3 Add visual hover styles for the reset layout button in `index.css`
