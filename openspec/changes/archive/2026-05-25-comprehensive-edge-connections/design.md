## Context
The previous patch (`bulletproof-edge-rendering`) perfectly solved the React Flow collision bug, but the edge-building code block was being starved of data. Because `gdb.go` assigns the output of `adv-dump` to `obj.AdvancedData`, `obj.StructuralLinks` is undefined on heap objects.

## Goals
- Connect the frontend graph builder to the correct data property (`advancedData`) for heap structures.
- Extend the edge-building graph logic to explicitly support `structuralLinks` embedded within stack local variables.

## Decisions
1. **Property Aliasing**: Rather than changing the rigid Go backend schema, we will dynamically alias the data on the frontend: `const links = obj.structuralLinks || obj.advancedData;`.
2. **Unified Edge Processor**: We will extract the structural edge creation loop into a helper function (or directly replicate it) so it can execute over both `snapshot.heap[].advancedData` and `snapshot.stack[].locals[].structuralLinks`. This ensures stack-based structs get the exact same premium arrows as heap-based structs.
