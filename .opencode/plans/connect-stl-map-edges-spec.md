## ADDED Requirements

### Requirement: Map Element Graph Connectivity
The visualization frontend SHALL render `std::map` and `std::pair` container elements as connected sub-nodes in the graph, with edges from the container to each element and from each element to its memory address (when available).

#### Scenario: Render map elements as connected sub-nodes
- **WHEN** a `std::map` with ≤50 entries is received in a snapshot
- **THEN** each key-value pair SHALL appear as an independent sub-node below the container
- **AND** a purple smoothstep edge SHALL connect the container node to each sub-node
- **AND** sub-nodes SHALL be arranged in a deterministic grid (max 5 per row)

#### Scenario: Render pair elements as connected sub-nodes
- **WHEN** a `std::pair` is received in a snapshot
- **THEN** two sub-nodes SHALL be created for `first` and `second`
- **AND** purple edges SHALL connect the parent pair node to each sub-node

#### Scenario: Element-to-memory address edges
- **WHEN** an element has a valid address (`!= "0x0"`)
- **AND** that address resolves to an existing graph node
- **THEN** a cyan edge SHALL connect the element sub-node to the memory node

#### Scenario: Fallback to table for large maps
- **WHEN** a `std::map` has more than 50 entries
- **THEN** the existing HTML table rendering SHALL be used instead of sub-nodes
- **AND** an indicator SHALL show the total count (e.g., "50+ entries")

#### Scenario: Collapse hides sub-nodes
- **WHEN** an STL container node is collapsed
- **THEN** all its element sub-nodes and their edges SHALL be hidden
- **AND** re-expanding SHALL restore visibility of all sub-nodes

#### Scenario: Non-associative containers unchanged
- **WHEN** a `std::vector` or `std::set` is received
- **THEN** the existing table/row rendering SHALL be used (no sub-nodes)
