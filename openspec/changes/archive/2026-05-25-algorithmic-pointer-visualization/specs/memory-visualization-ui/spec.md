## MODIFIED Requirements

### Requirement: Algorithmic Pointer Tracking
The graph topology SHALL represent all local stack pointers as distinct, physical nodes on the canvas. If multiple stack pointers reference the exact same heap memory address, they SHALL NOT be merged or hidden.

#### Scenario: Visualizing Hare & Tortoise
- **WHEN** the user declares `ListNode* slow` and `ListNode* fast` both pointing to the head of a linked list.
- **THEN** the UI renders two distinct floating nodes (`📍 slow` and `📍 fast`).
- **AND** both nodes emit distinctly colored, animated SVG arrows pointing directly to the list's head node, physically tracking their movement as the algorithm steps.
