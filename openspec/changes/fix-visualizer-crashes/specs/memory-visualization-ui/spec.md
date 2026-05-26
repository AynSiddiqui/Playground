## MODIFIED Requirements

### Requirement: Resilient Snapshot Parsing
The frontend UI SHALL not crash if the backend sends an empty or partially malformed JSON snapshot during a failure state.

#### Scenario: Handling a missing heap
- **WHEN** the frontend receives a snapshot where `heap` is `null`
- **THEN** it gracefully defaults to an empty array and renders a blank canvas instead of throwing a `TypeError`.

### Requirement: Disjoint Stack and Heap Nodes
The visualizer SHALL enforce a strict separation between Stack variables and Heap allocations. Stack nodes must never visually encapsulate or embed Heap nodes.

#### Scenario: Visualizing a Linked List pointer
- **WHEN** `main.cpp` contains `ListNode* head`
- **THEN** the UI draws a separate, disjoint box for the `ListNode` object with its value and location defined within it, and draws a clear reference pointer (arrow) from the stack variable to this box without collisions.
