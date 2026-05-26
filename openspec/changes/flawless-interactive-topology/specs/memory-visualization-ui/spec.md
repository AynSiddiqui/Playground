## MODIFIED Requirements

### Requirement: Interactive Node Dragging
All memory nodes and badges SHALL be independently draggable across the React Flow canvas. The UI must maintain their updated positions.

### Requirement: Guaranteed Structural Arrows
Any pointer mapped from a complex structure (e.g., `next` inside a Linked List) SHALL reliably spawn a physical edge connection Handle, ensuring structural arrows are never dropped.

### Requirement: Multiple Pointer Badging
If multiple variables in the current stack frame reference the exact same heap memory address, they SHALL NOT render as overlapping pointer arrows. Instead, the UI SHALL map all their names as combined badges (e.g., `[ a ] [ cur ]`) placed directly on the referenced heap node.
