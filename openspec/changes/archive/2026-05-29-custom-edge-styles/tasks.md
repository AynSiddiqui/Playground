## 1. Setup and Local State

- [x] 1.1 Add React state in MemoryCanvas to manage the selected edge style
- [x] 1.2 Persist the selected edge style preference in localStorage and retrieve it during initialization

## 2. Dynamic Edge Configuration

- [x] 2.1 Refactor buildNodesAndEdges to accept the selected edge style
- [x] 2.2 Update edge generators in buildNodesAndEdges to map 'smoothstep', 'straight', and 'default' dynamically based on state
- [x] 2.3 Adjust edge animated property conditionally based on selected edge style

## 3. UI Control Panel

- [x] 3.1 Import Panel from @xyflow/react
- [x] 3.2 Implement a floating Selector overlay inside the ReactFlow component containing button options
- [x] 3.3 Style the Selector panel and buttons with glassmorphism CSS in index.css
