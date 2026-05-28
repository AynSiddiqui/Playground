## ADDED Requirements

### Requirement: Robust Handle-to-Edge Connection
The visualizer canvas SHALL ensure all connection lines (edges) snap directly to their designated row-level source handles on the right edge of node cards. Edges MUST NOT connect to the node border, corners, or center when a valid row-level pointer handle is rendered.

#### Scenario: Connecting pointer edges to row-level handles
- **WHEN** a memory node containing pointer variables or fields is rendered
- **AND** connection edges are drawn from these pointers to target nodes
- **THEN** every edge line originates exactly from the center of the row-level cyan handle on the right edge of the card
- **AND** no edge lines start from the node boundaries or corners
