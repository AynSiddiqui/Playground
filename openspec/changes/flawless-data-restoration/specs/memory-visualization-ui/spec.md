## MODIFIED Requirements

### Requirement: Full Structural Expansion
The visualizer SHALL dynamically render nodes that exist in a structure's `nodes` registry even if they are missing from the root heap snapshot, guaranteeing that Binary Trees and Deep Linked Lists render fully.

### Requirement: Inner Data Display
Every generated memory node SHALL display its inner fields and values. Structural pointers (like `next`, `left`) SHALL generate functional anchor Handles for edges to connect to.
