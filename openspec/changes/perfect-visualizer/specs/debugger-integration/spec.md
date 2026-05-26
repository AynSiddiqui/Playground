## ADDED Requirements

### Requirement: Stack Complex Variable Extraction
The backend SHALL detect complex variables (STLs, Arrays, Structs) instantiated on the stack and assign them a memory address in the `locals` output.

### Requirement: Topology Flattening
The backend pointer chaser SHALL treat any variable with a defined memory address as a candidate for extraction, bypassing strict pointer type-checking, enabling standalone graphical nodes for non-pointer STLs.
