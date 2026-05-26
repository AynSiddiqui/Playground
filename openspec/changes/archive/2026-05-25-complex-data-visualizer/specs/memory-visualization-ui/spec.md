## ADDED Requirements

### Requirement: Interactive Node Linking
The UI SHALL render SVG edges between Memory Nodes when the `advancedData` payload contains pointer addresses pointing to other heap or stack objects.

#### Scenario: Visualizing a Tree
- **WHEN** the backend payload contains a `tree_node` with `left` and `right` addresses
- **THEN** the React Flow canvas draws Bezier edges connecting the parent node's `<Handle>` to the child nodes' addresses.

### Requirement: Variable Initialization Context
The UI SHALL gracefully display uninitialized memory values without breaking layouts, and may annotate them to prevent confusion for beginners.

#### Scenario: Uninitialized stack variable
- **WHEN** a variable contains a value like `29790`
- **THEN** it is displayed cleanly, updating smoothly on the next step when the explicit assignment executes.
