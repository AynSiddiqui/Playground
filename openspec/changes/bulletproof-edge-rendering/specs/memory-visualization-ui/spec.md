## MODIFIED Requirements

### Requirement: Guaranteed Edge Rendering
The graph builder SHALL ensure that all generated pointer edges possess strictly unique IDs. If the backend serialization creates overlapping edge paths, the frontend SHALL deduplicate them before passing them to the rendering engine to prevent render failures.

#### Scenario: Visualizing overlapping list paths
- **WHEN** variables `a` and `b` both traverse the same linked list segment
- **THEN** the UI engine filters out the redundant edges, ensuring exactly one clear arrow connects node `1` to node `2`, rather than failing to draw any arrow at all.
