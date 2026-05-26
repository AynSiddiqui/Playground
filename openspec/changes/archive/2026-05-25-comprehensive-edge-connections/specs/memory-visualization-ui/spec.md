## MODIFIED Requirements

### Requirement: Guaranteed Edge Rendering
The graph builder SHALL draw pointer arrows for all recognized structural relationships (Linked Lists, Binary Trees), unconditionally handling data mapped to either `structuralLinks` or `advancedData`.

#### Scenario: Visualizing Stack-Allocated Lists
- **WHEN** a user defines `ListNode a; ListNode b; a.next = &b;`
- **THEN** the UI SHALL draw a highly visible SVG arrow connecting the box for `a` to the box for `b`, instead of ignoring the stack variable's structural links.
